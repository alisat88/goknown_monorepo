import crypto from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { inject, injectable } from 'tsyringe';

import uploadConfig from '@config/upload';
import IStorageProvider from '@shared/container/providers/StorageProvider/models/IStorageProvider';

import DigitalAsset, {
  MediaProcessingStatus,
} from '../infra/typeorm/entities/DigitalAsset';
import DigitalAssetMediaArtifact, {
  MediaArtifactRole,
} from '../infra/typeorm/entities/DigitalAssetMediaArtifact';
import IDigitalAssetContentClaimsRepository from '../repositories/IDigitalAssetContentClaimsRepository';
import IDigitalAssetMediaArtifactsRepository from '../repositories/IDigitalAssetMediaArtifactsRepository';
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';

interface IRequest {
  sync_id: string;
}

const JPEG_MIME_TYPES = ['image/jpeg', 'image/jpg'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime'];

const IMAGE_CONTENT_HASH_SCHEME =
  'image-rgba8-srgb-auto-orient-v1';

interface ICanonicalImageHash {
  content_sha256: string;
  width: number;
  height: number;
  scheme: string;
}

@injectable()
class ProcessDigitalAssetMediaService {
  constructor(
    @inject('StorageProvider')
    private storageProvider: IStorageProvider,

    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('DigitalAssetMediaArtifactsRepository')
    private mediaArtifactsRepository: IDigitalAssetMediaArtifactsRepository,

    @inject('DigitalAssetContentClaimsRepository')
    private contentClaimsRepository: IDigitalAssetContentClaimsRepository,
  ) {}

  private async runCommand(command: string, args: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      let stderr = '';

      child.stderr.on('data', chunk => {
        if (stderr.length < 65536) {
          stderr += chunk.toString();
        }
      });

      child.on('error', reject);

      child.on('close', code => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `${command} exited with code ${code}${
              stderr ? `: ${stderr.trim()}` : ''
            }`,
          ),
        );
      });
    });
  }

  private async hashFileSha256(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', chunk => {
        hash.update(chunk);
      });

      stream.on('error', reject);

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
    });
  }

  private async runCommandCapture(
    command: string,
    args: string[],
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', chunk => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', chunk => {
        if (stderr.length < 65536) {
          stderr += chunk.toString();
        }
      });

      child.on('error', reject);

      child.on('close', code => {
        if (code === 0) {
          resolve(stdout);
          return;
        }

        reject(
          new Error(
            `${command} exited with code ${code}${
              stderr ? `: ${stderr.trim()}` : ''
            }`,
          ),
        );
      });
    });
  }

  private async hashCanonicalImage(
    filePath: string,
  ): Promise<ICanonicalImageHash> {
    const imageMagickBinary =
      process.env.IMAGEMAGICK_BINARY || 'magick';

    const dimensionsOutput = await this.runCommandCapture(
      imageMagickBinary,
      [
        filePath,
        '-auto-orient',
        '-colorspace',
        'sRGB',
        '-alpha',
        'on',
        '-depth',
        '8',
        '-format',
        '%w %h',
        'info:',
      ],
    );

    const dimensions = dimensionsOutput.trim().match(
      /^(\d+)\s+(\d+)$/,
    );

    if (!dimensions) {
      throw new Error(
        `Unable to determine canonical image dimensions: ${dimensionsOutput.trim()}`,
      );
    }

    const width = Number(dimensions[1]);
    const height = Number(dimensions[2]);

    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(
        `Invalid canonical image dimensions: ${width}x${height}`,
      );
    }

    const hash = crypto.createHash('sha256');

    hash.update(
      Buffer.from(
        `${IMAGE_CONTENT_HASH_SCHEME}\0${width}x${height}\0`,
        'utf8',
      ),
    );

    const expectedPixelBytes = width * height * 4;
    let actualPixelBytes = 0;

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        imageMagickBinary,
        [
          filePath,
          '-auto-orient',
          '-colorspace',
          'sRGB',
          '-alpha',
          'on',
          '-depth',
          '8',
          'rgba:-',
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      let stderr = '';

      child.stdout.on('data', chunk => {
        actualPixelBytes += chunk.length;
        hash.update(chunk);
      });

      child.stderr.on('data', chunk => {
        if (stderr.length < 65536) {
          stderr += chunk.toString();
        }
      });

      child.on('error', reject);

      child.on('close', code => {
        if (code !== 0) {
          reject(
            new Error(
              `${imageMagickBinary} exited with code ${code}${
                stderr ? `: ${stderr.trim()}` : ''
              }`,
            ),
          );
          return;
        }

        resolve();
      });
    });

    if (actualPixelBytes !== expectedPixelBytes) {
      throw new Error(
        `Canonical RGBA byte count mismatch: expected ${expectedPixelBytes}, got ${actualPixelBytes}`,
      );
    }

    return {
      content_sha256: hash.digest('hex'),
      width,
      height,
      scheme: IMAGE_CONTENT_HASH_SCHEME,
    };
  }

  private buildStorageKey(
    filename: string,
    folder?: string,
  ): string {
    const normalizedFilename = filename
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');

    if (folder) {
      const normalizedFolder = folder
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '');

      return normalizedFolder
        ? `${normalizedFolder}/${normalizedFilename}`
        : normalizedFilename;
    }

    if (
      uploadConfig.driver !== 's3' &&
      uploadConfig.driver !== 'digitalocean'
    ) {
      return normalizedFilename;
    }

    const prefix = uploadConfig.config.aws.keyPrefix.replace(
      /^\/+|\/+$/g,
      '',
    );

    return prefix
      ? `${prefix}/${normalizedFilename}`
      : normalizedFilename;
  }

  private async convertJpeg(
    digitalAsset: DigitalAsset,
    sourcePath: string,
    tempDirectory: string,
  ): Promise<void> {
    const assetKey = digitalAsset.sync_id || digitalAsset.id;
    const derivativeFolder = `media-derived/${assetKey}`;
    const outputFilename = 'image.png';
    const outputPath = path.join(tempDirectory, outputFilename);

    const imageMagickBinary =
      process.env.IMAGEMAGICK_BINARY || 'magick';

    const sourceFileSha256 =
      await this.hashFileSha256(sourcePath);

    const sourceCanonical =
      await this.hashCanonicalImage(sourcePath);

    await this.runCommand(imageMagickBinary, [
      sourcePath,
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-alpha',
      'on',
      '-depth',
      '8',
      '-strip',
      outputPath,
    ]);

    const pngFileSha256 =
      await this.hashFileSha256(outputPath);

    const pngCanonical =
      await this.hashCanonicalImage(outputPath);

    const canonicalContentMatches =
      sourceCanonical.scheme === pngCanonical.scheme &&
      sourceCanonical.width === pngCanonical.width &&
      sourceCanonical.height === pngCanonical.height &&
      sourceCanonical.content_sha256 ===
        pngCanonical.content_sha256;

    if (!canonicalContentMatches) {
      throw new Error(
        'JPEG/PNG canonical content verification failed',
      );
    }

    await this.storageProvider.uploadFile(
      outputPath,
      outputFilename,
      derivativeFolder,
    );

    const sourceArtifact: DigitalAssetMediaArtifact =
      await this.mediaArtifactsRepository.saveArtifact({
        digital_asset_id: digitalAsset.id,
        role: MediaArtifactRole.Source,
        storage_key: this.buildStorageKey(
          digitalAsset.filename,
        ),
        mimetype: digitalAsset.mimetype,
        file_sha256: sourceFileSha256,
        content_sha256: sourceCanonical.content_sha256,
        content_hash_scheme: sourceCanonical.scheme,
        derived_from_id: null,
      });

    await this.mediaArtifactsRepository.saveArtifact({
      digital_asset_id: digitalAsset.id,
      role: MediaArtifactRole.Preservation,
      storage_key: this.buildStorageKey(
        outputFilename,
        derivativeFolder,
      ),
      mimetype: 'image/png',
      file_sha256: pngFileSha256,
      content_sha256: pngCanonical.content_sha256,
      content_hash_scheme: pngCanonical.scheme,
      derived_from_id: sourceArtifact.id,
    });

    await this.contentClaimsRepository.claimFirst({
      content_sha256: sourceCanonical.content_sha256,
      content_hash_scheme: sourceCanonical.scheme,
      first_digital_asset_id: digitalAsset.id,
      first_user_id: digitalAsset.user_id || null,
      first_source_file_sha256: sourceFileSha256,
      first_seen_at: digitalAsset.created_at,
    });

    digitalAsset.media_derivative_prefix = derivativeFolder;
    digitalAsset.media_frame_count = null;
  }

  private async convertVideo(
    digitalAsset: DigitalAsset,
    sourcePath: string,
    tempDirectory: string,
  ): Promise<void> {
    const assetKey = digitalAsset.sync_id || digitalAsset.id;
    const derivativeFolder = `media-derived/${assetKey}/frames`;
    const ffmpegBinary = process.env.FFMPEG_BINARY || 'ffmpeg';
    const imageMagickBinary =
      process.env.IMAGEMAGICK_BINARY || 'magick';

    const configuredMaxFrameBytes = Number(
      process.env.MEDIA_MAX_FRAME_BYTES ||
        128 * 1024 * 1024,
    );

    const maxFrameBytes = Math.min(
      Math.max(
        Number.isFinite(configuredMaxFrameBytes)
          ? configuredMaxFrameBytes
          : 128 * 1024 * 1024,
        1024 * 1024,
      ),
      512 * 1024 * 1024,
    );

    const child = spawn(
      ffmpegBinary,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        sourcePath,
        '-map',
        '0:v:0',
        '-fps_mode',
        'passthrough',
        '-q:v',
        '2',
        '-f',
        'image2pipe',
        '-vcodec',
        'mjpeg',
        'pipe:1',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stderr = '';

    child.stderr.on('data', chunk => {
      if (stderr.length < 65536) {
        stderr += chunk.toString();
      }
    });

    const completion = new Promise<{
      code: number | null;
      error?: Error;
    }>(resolve => {
      child.once('error', error => {
        resolve({ code: null, error });
      });

      child.once('close', code => {
        resolve({ code });
      });
    });

    const jpegStart = Buffer.from([0xff, 0xd8]);
    const jpegEnd = Buffer.from([0xff, 0xd9]);

    let buffer = Buffer.alloc(0);
    let frameCount = 0;

    try {
      for await (const chunk of child.stdout) {
        buffer = Buffer.concat([
          buffer,
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
        ]);

        while (true) {
          const startIndex = buffer.indexOf(jpegStart);

          if (startIndex < 0) {
            if (buffer.length > 1) {
              buffer = buffer.subarray(buffer.length - 1);
            }
            break;
          }

          if (startIndex > 0) {
            buffer = buffer.subarray(startIndex);
          }

          const endIndex = buffer.indexOf(jpegEnd, 2);

          if (endIndex < 0) {
            if (buffer.length > maxFrameBytes) {
              throw new Error(
                `FFmpeg JPEG frame exceeded ${maxFrameBytes} bytes`,
              );
            }

            break;
          }

          const frame = buffer.subarray(0, endIndex + 2);
          buffer = buffer.subarray(endIndex + 2);

          frameCount += 1;

          const filename =
            `frame-${String(frameCount).padStart(8, '0')}.jpg`;

          const localFramePath = path.join(
            tempDirectory,
            filename,
          );

          await fs.promises.writeFile(localFramePath, frame);

          if (frameCount === 1) {
            const previewFilename = 'preview.png';
            const previewPath = path.join(
              tempDirectory,
              previewFilename,
            );

            try {
              await this.runCommand(imageMagickBinary, [
                localFramePath,
                previewPath,
              ]);

              await this.storageProvider.uploadFile(
                previewPath,
                previewFilename,
                derivativeFolder,
              );
            } finally {
              await fs.promises.unlink(previewPath).catch(() => {
                // Temporary directory cleanup in execute() is the fallback.
              });
            }
          }

          try {
            await this.storageProvider.uploadFile(
              localFramePath,
              filename,
              derivativeFolder,
            );
          } finally {
            await fs.promises.unlink(localFramePath).catch(() => {
              // Temporary directory cleanup in execute() is the fallback.
            });
          }
        }
      }

      const result = await completion;

      if (result.error) {
        throw result.error;
      }

      if (result.code !== 0) {
        throw new Error(
          `${ffmpegBinary} exited with code ${result.code}${
            stderr ? `: ${stderr.trim()}` : ''
          }`,
        );
      }
    } catch (error) {
      if (!child.killed) {
        child.kill('SIGKILL');
      }

      await completion;
      throw error;
    }

    if (frameCount === 0) {
      throw new Error('FFmpeg produced no JPEG frames');
    }

    digitalAsset.media_derivative_prefix = derivativeFolder;
    digitalAsset.media_frame_count = frameCount;
  }

  public async execute({ sync_id }: IRequest): Promise<DigitalAsset> {
    const digitalAsset =
      await this.digitalAssetsRepository.findBySyncId(sync_id);

    if (!digitalAsset) {
      throw new Error('Digital asset not found');
    }

    const isJpeg = JPEG_MIME_TYPES.includes(digitalAsset.mimetype);
    const isVideo = VIDEO_MIME_TYPES.includes(digitalAsset.mimetype);

    if (!isJpeg && !isVideo) {
      return digitalAsset;
    }

    digitalAsset.media_processing_status =
      MediaProcessingStatus.Processing;
    digitalAsset.media_processing_error = null;

    await this.digitalAssetsRepository.save(digitalAsset);

    const tempDirectory = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'goknown-media-'),
    );

    const extension = path.extname(digitalAsset.filename);
    const sourcePath = path.join(
      tempDirectory,
      `source${extension}`,
    );

    try {
      await this.storageProvider.downloadFile(
        digitalAsset.filename,
        sourcePath,
      );

      if (isJpeg) {
        await this.convertJpeg(
          digitalAsset,
          sourcePath,
          tempDirectory,
        );
      } else {
        await this.convertVideo(
          digitalAsset,
          sourcePath,
          tempDirectory,
        );
      }

      digitalAsset.media_processing_status =
        MediaProcessingStatus.Ready;
      digitalAsset.media_processing_error = null;

      return await this.digitalAssetsRepository.save(digitalAsset);
    } catch (error) {
      console.error(
        `Media conversion failed for ${digitalAsset.sync_id}:`,
        error instanceof Error ? error.message : error,
      );

      digitalAsset.media_processing_status =
        MediaProcessingStatus.Failed;
      digitalAsset.media_processing_error =
        'Media conversion failed';

      await this.digitalAssetsRepository.save(digitalAsset);

      throw error;
    } finally {
      await fs.promises.rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
  }
}

export default ProcessDigitalAssetMediaService;
