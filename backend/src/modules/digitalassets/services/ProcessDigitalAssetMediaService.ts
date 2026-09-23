import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { inject, injectable } from 'tsyringe';

import IStorageProvider from '@shared/container/providers/StorageProvider/models/IStorageProvider';

import DigitalAsset, {
  MediaProcessingStatus,
} from '../infra/typeorm/entities/DigitalAsset';
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';

interface IRequest {
  sync_id: string;
}

const JPEG_MIME_TYPES = ['image/jpeg', 'image/jpg'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/mpeg'];

@injectable()
class ProcessDigitalAssetMediaService {
  constructor(
    @inject('StorageProvider')
    private storageProvider: IStorageProvider,

    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,
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

    await this.runCommand(imageMagickBinary, [
      sourcePath,
      outputPath,
    ]);

    await this.storageProvider.uploadFile(
      outputPath,
      outputFilename,
      derivativeFolder,
    );

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
