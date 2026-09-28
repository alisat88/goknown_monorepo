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
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3'];

const IMAGE_CONTENT_HASH_SCHEME =
  'image-rgba8-srgb-auto-orient-v1';

const AUDIO_CONTENT_HASH_SCHEME =
  'audio-pcm-s24le-source-rate-layout-v1';

const VIDEO_FRAME_HASH_SCHEME =
  'video-rgba64le-frame-sequence-v1';

const VIDEO_CONTENT_HASH_SCHEME =
  'av-rgba64le-frame-sequence-pcm-s24le-v1';

interface ICanonicalImageHash {
  content_sha256: string;
  width: number;
  height: number;
  scheme: string;
}

interface IAudioProbe {
  codec_name: string;
  sample_rate: number;
  channels: number;
  channel_layout: string;
}

interface ICanonicalAudioHash extends IAudioProbe {
  content_sha256: string;
  pcm_bytes: number;
  scheme: string;
}

interface IVideoProbe {
  codec_name: string;
  pix_fmt: string;
  width: number;
  height: number;
  rotation: number;
  display_width: number;
  display_height: number;
}

interface ICanonicalVideoFrameHash extends IVideoProbe {
  content_sha256: string;
  frame_count: number;
  raw_bytes: number;
  scheme: string;
}

interface ICanonicalVideoContent {
  content_sha256: string;
  video: ICanonicalVideoFrameHash;
  audio: ICanonicalAudioHash | null;
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

  private async probeAudioStream(
    filePath: string,
  ): Promise<IAudioProbe> {
    const ffprobeBinary =
      process.env.FFPROBE_BINARY || 'ffprobe';

    const output = await this.runCommandCapture(
      ffprobeBinary,
      [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_entries',
        'stream=codec_name,sample_rate,channels,channel_layout',
        '-of',
        'json',
        filePath,
      ],
    );

    let parsed: {
      streams?: Array<{
        codec_name?: string;
        sample_rate?: string;
        channels?: number;
        channel_layout?: string;
      }>;
    };

    try {
      parsed = JSON.parse(output);
    } catch {
      throw new Error(
        'Unable to parse FFprobe audio metadata',
      );
    }

    const stream = parsed.streams?.[0];

    if (!stream) {
      throw new Error('No audio stream found');
    }

    const codecName = String(
      stream.codec_name || '',
    ).toLowerCase();

    const sampleRate = Number(stream.sample_rate);
    const channels = Number(stream.channels);

    if (
      !Number.isSafeInteger(sampleRate) ||
      sampleRate <= 0
    ) {
      throw new Error(
        `Invalid audio sample rate: ${stream.sample_rate}`,
      );
    }

    if (
      !Number.isSafeInteger(channels) ||
      channels <= 0
    ) {
      throw new Error(
        `Invalid audio channel count: ${stream.channels}`,
      );
    }

    let channelLayout = String(
      stream.channel_layout || '',
    )
      .trim()
      .toLowerCase();

    if (!channelLayout) {
      if (channels === 1) {
        channelLayout = 'mono';
      } else if (channels === 2) {
        channelLayout = 'stereo';
      } else {
        throw new Error(
          `Audio channel layout is unavailable for ${channels} channels`,
        );
      }
    }

    return {
      codec_name: codecName,
      sample_rate: sampleRate,
      channels,
      channel_layout: channelLayout,
    };
  }

  private async hashCanonicalAudio(
    filePath: string,
  ): Promise<ICanonicalAudioHash> {
    const ffmpegBinary =
      process.env.FFMPEG_BINARY || 'ffmpeg';

    const probe = await this.probeAudioStream(filePath);

    const hash = crypto.createHash('sha256');

    hash.update(
      Buffer.from(
        `${AUDIO_CONTENT_HASH_SCHEME}\0${probe.sample_rate}\0${probe.channels}\0${probe.channel_layout}\0`,
        'utf8',
      ),
    );

    let pcmBytes = 0;

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        ffmpegBinary,
        [
          '-hide_banner',
          '-loglevel',
          'error',
          '-i',
          filePath,
          '-map',
          '0:a:0',
          '-vn',
          '-sn',
          '-dn',
          '-f',
          's24le',
          '-c:a',
          'pcm_s24le',
          'pipe:1',
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      let stderr = '';

      child.stdout.on('data', chunk => {
        pcmBytes += chunk.length;
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
              `${ffmpegBinary} exited with code ${code}${
                stderr ? `: ${stderr.trim()}` : ''
              }`,
            ),
          );
          return;
        }

        resolve();
      });
    });

    if (pcmBytes === 0) {
      throw new Error(
        'Canonical audio stream contained no PCM data',
      );
    }

    const frameBytes = probe.channels * 3;

    if (pcmBytes % frameBytes !== 0) {
      throw new Error(
        `Canonical PCM24 byte count ${pcmBytes} is not divisible by frame size ${frameBytes}`,
      );
    }

    return {
      ...probe,
      content_sha256: hash.digest('hex'),
      pcm_bytes: pcmBytes,
      scheme: AUDIO_CONTENT_HASH_SCHEME,
    };
  }

  private async probeVideoStream(
    filePath: string,
  ): Promise<IVideoProbe> {
    const ffprobeBinary =
      process.env.FFPROBE_BINARY || 'ffprobe';

    const output = await this.runCommandCapture(
      ffprobeBinary,
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=codec_name,pix_fmt,width,height:stream_side_data=rotation',
        '-of',
        'json',
        filePath,
      ],
    );

    let parsed: {
      streams?: Array<{
        codec_name?: string;
        pix_fmt?: string;
        width?: number;
        height?: number;
        side_data_list?: Array<{
          rotation?: number | string;
        }>;
      }>;
    };

    try {
      parsed = JSON.parse(output);
    } catch {
      throw new Error(
        'Unable to parse FFprobe video metadata',
      );
    }

    const stream = parsed.streams?.[0];

    if (!stream) {
      throw new Error('No video stream found');
    }

    const codecName = String(
      stream.codec_name || '',
    ).toLowerCase();

    if (!codecName) {
      throw new Error(
        'Unable to determine video codec',
      );
    }

    const pixFmt = String(
      stream.pix_fmt || '',
    ).toLowerCase();

    const width = Number(stream.width);
    const height = Number(stream.height);

    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(
        `Invalid video dimensions: ${stream.width}x${stream.height}`,
      );
    }

    const rotationEntry =
      stream.side_data_list?.find(
        item => item.rotation !== undefined,
      );

    const rotationValue =
      rotationEntry?.rotation;

    const rotation =
      rotationValue === undefined
        ? 0
        : Number(rotationValue);

    if (!Number.isFinite(rotation)) {
      throw new Error(
        `Invalid video rotation: ${rotationValue}`,
      );
    }

    const roundedRotation = Math.round(rotation);

    if (
      Math.abs(rotation - roundedRotation) >
      0.000001
    ) {
      throw new Error(
        `Unsupported non-integral video rotation: ${rotation}`,
      );
    }

    const normalizedRotation =
      ((roundedRotation % 360) + 360) % 360;

    if (
      normalizedRotation !== 0 &&
      normalizedRotation !== 90 &&
      normalizedRotation !== 180 &&
      normalizedRotation !== 270
    ) {
      throw new Error(
        `Unsupported video rotation: ${rotation}`,
      );
    }

    const swapsDimensions =
      normalizedRotation === 90 ||
      normalizedRotation === 270;

    return {
      codec_name: codecName,
      pix_fmt: pixFmt,
      width,
      height,
      rotation,
      display_width:
        swapsDimensions ? height : width,
      display_height:
        swapsDimensions ? width : height,
    };
  }

  private async hasAudioStream(
    filePath: string,
  ): Promise<boolean> {
    const ffprobeBinary =
      process.env.FFPROBE_BINARY || 'ffprobe';

    const output = await this.runCommandCapture(
      ffprobeBinary,
      [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_entries',
        'stream=index',
        '-of',
        'json',
        filePath,
      ],
    );

    let parsed: {
      streams?: Array<{
        index?: number;
      }>;
    };

    try {
      parsed = JSON.parse(output);
    } catch {
      throw new Error(
        'Unable to parse FFprobe audio-stream metadata',
      );
    }

    return Boolean(
      parsed.streams &&
        parsed.streams.length > 0,
    );
  }

  private async hashCanonicalVideoFrames(
    filePath: string,
  ): Promise<ICanonicalVideoFrameHash> {
    const ffmpegBinary =
      process.env.FFMPEG_BINARY || 'ffmpeg';

    const probe =
      await this.probeVideoStream(filePath);

    const frameBytes =
      probe.display_width *
      probe.display_height *
      8;

    if (
      !Number.isSafeInteger(frameBytes) ||
      frameBytes <= 0
    ) {
      throw new Error(
        `Invalid canonical video frame size: ${frameBytes}`,
      );
    }

    const hash = crypto.createHash('sha256');

    hash.update(
      Buffer.from(
        `${VIDEO_FRAME_HASH_SCHEME}\0${probe.display_width}x${probe.display_height}\0`,
        'utf8',
      ),
    );

    let rawBytes = 0;

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        ffmpegBinary,
        [
          '-nostdin',
          '-hide_banner',
          '-loglevel',
          'error',
          '-i',
          filePath,
          '-map',
          '0:v:0',
          '-an',
          '-sn',
          '-dn',
          '-fps_mode',
          'passthrough',
          '-f',
          'rawvideo',
          '-pix_fmt',
          'rgba64le',
          'pipe:1',
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      let stderr = '';

      child.stdout.on('data', chunk => {
        rawBytes += chunk.length;
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
              `${ffmpegBinary} exited with code ${code}${
                stderr
                  ? `: ${stderr.trim()}`
                  : ''
              }`,
            ),
          );
          return;
        }

        resolve();
      });
    });

    if (rawBytes === 0) {
      throw new Error(
        'Canonical video stream contained no frame data',
      );
    }

    if (rawBytes % frameBytes !== 0) {
      throw new Error(
        `Canonical video byte count ${rawBytes} is not divisible by frame size ${frameBytes}`,
      );
    }

    const frameCount =
      rawBytes / frameBytes;

    if (
      !Number.isSafeInteger(frameCount) ||
      frameCount <= 0
    ) {
      throw new Error(
        `Invalid canonical video frame count: ${frameCount}`,
      );
    }

    hash.update(
      Buffer.from(
        `\0frames=${frameCount}\0`,
        'utf8',
      ),
    );

    return {
      ...probe,
      content_sha256: hash.digest('hex'),
      frame_count: frameCount,
      raw_bytes: rawBytes,
      scheme: VIDEO_FRAME_HASH_SCHEME,
    };
  }

  private async hashCanonicalVideoContent(
    filePath: string,
  ): Promise<ICanonicalVideoContent> {
    const video =
      await this.hashCanonicalVideoFrames(
        filePath,
      );

    const hasAudio =
      await this.hasAudioStream(filePath);

    const audio = hasAudio
      ? await this.hashCanonicalAudio(filePath)
      : null;

    const hash = crypto.createHash('sha256');

    const audioDescriptor = audio
      ? `${audio.scheme}:${audio.content_sha256}`
      : 'none';

    hash.update(
      Buffer.from(
        `${VIDEO_CONTENT_HASH_SCHEME}\0video=${video.scheme}:${video.content_sha256}\0audio=${audioDescriptor}\0`,
        'utf8',
      ),
    );

    return {
      content_sha256: hash.digest('hex'),
      video,
      audio,
      scheme: VIDEO_CONTENT_HASH_SCHEME,
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

  private async convertAudio(
    digitalAsset: DigitalAsset,
    sourcePath: string,
    tempDirectory: string,
  ): Promise<void> {
    const assetKey = digitalAsset.sync_id || digitalAsset.id;
    const derivativeFolder = `media-derived/${assetKey}`;
    const outputFilename = 'audio.flac';
    const outputPath = path.join(
      tempDirectory,
      outputFilename,
    );

    const ffmpegBinary =
      process.env.FFMPEG_BINARY || 'ffmpeg';

    const sourceFileSha256 =
      await this.hashFileSha256(sourcePath);

    const sourceCanonical =
      await this.hashCanonicalAudio(sourcePath);

    if (sourceCanonical.codec_name !== 'mp3') {
      throw new Error(
        `Expected MP3 audio but FFprobe detected ${sourceCanonical.codec_name || 'unknown codec'}`,
      );
    }

    await this.runCommand(ffmpegBinary, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      sourcePath,
      '-map',
      '0:a:0',
      '-vn',
      '-sn',
      '-dn',
      '-map_metadata',
      '-1',
      '-map_chapters',
      '-1',
      '-c:a',
      'flac',
      '-sample_fmt',
      's32',
      '-compression_level',
      '8',
      outputPath,
    ]);

    const flacFileSha256 =
      await this.hashFileSha256(outputPath);

    const flacCanonical =
      await this.hashCanonicalAudio(outputPath);

    if (flacCanonical.codec_name !== 'flac') {
      throw new Error(
        `Expected FLAC derivative but FFprobe detected ${flacCanonical.codec_name || 'unknown codec'}`,
      );
    }

    const canonicalContentMatches =
      sourceCanonical.scheme === flacCanonical.scheme &&
      sourceCanonical.sample_rate ===
        flacCanonical.sample_rate &&
      sourceCanonical.channels ===
        flacCanonical.channels &&
      sourceCanonical.channel_layout ===
        flacCanonical.channel_layout &&
      sourceCanonical.pcm_bytes ===
        flacCanonical.pcm_bytes &&
      sourceCanonical.content_sha256 ===
        flacCanonical.content_sha256;

    if (!canonicalContentMatches) {
      throw new Error(
        'MP3/FLAC canonical audio verification failed',
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
        content_sha256:
          sourceCanonical.content_sha256,
        content_hash_scheme:
          sourceCanonical.scheme,
        derived_from_id: null,
      });

    await this.mediaArtifactsRepository.saveArtifact({
      digital_asset_id: digitalAsset.id,
      role: MediaArtifactRole.Preservation,
      storage_key: this.buildStorageKey(
        outputFilename,
        derivativeFolder,
      ),
      mimetype: 'audio/flac',
      file_sha256: flacFileSha256,
      content_sha256:
        flacCanonical.content_sha256,
      content_hash_scheme:
        flacCanonical.scheme,
      derived_from_id: sourceArtifact.id,
    });

    await this.contentClaimsRepository.claimFirst({
      content_sha256:
        sourceCanonical.content_sha256,
      content_hash_scheme:
        sourceCanonical.scheme,
      first_digital_asset_id: digitalAsset.id,
      first_user_id: digitalAsset.user_id || null,
      first_source_file_sha256: sourceFileSha256,
      first_seen_at: digitalAsset.created_at,
    });

    digitalAsset.media_derivative_prefix =
      derivativeFolder;

    digitalAsset.media_frame_count = null;
  }

  private async convertVideo(
    digitalAsset: DigitalAsset,
    sourcePath: string,
    tempDirectory: string,
  ): Promise<void> {
    const assetKey =
      digitalAsset.sync_id || digitalAsset.id;

    const derivativeFolder =
      `media-derived/${assetKey}`;

    const preservationFilename =
      'preservation.mkv';

    const playbackFilename =
      'playback.mp4';

    const preservationPath = path.join(
      tempDirectory,
      preservationFilename,
    );

    const playbackPath = path.join(
      tempDirectory,
      playbackFilename,
    );

    const ffmpegBinary =
      process.env.FFMPEG_BINARY || 'ffmpeg';

    const sourceFileSha256 =
      await this.hashFileSha256(sourcePath);

    const sourceCanonical =
      await this.hashCanonicalVideoContent(
        sourcePath,
      );

    const preservationArgs = [
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      sourcePath,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0?',
      '-map_metadata',
      '-1',
      '-map_chapters',
      '-1',
      '-fps_mode',
      'passthrough',
      '-c:v',
      'ffv1',
      '-level',
      '3',
      '-g',
      '1',
      '-slicecrc',
      '1',
    ];

    if (sourceCanonical.audio) {
      preservationArgs.push(
        '-c:a',
        'flac',
        '-sample_fmt',
        's32',
        '-compression_level',
        '8',
      );
    } else {
      preservationArgs.push('-an');
    }

    preservationArgs.push(
      preservationPath,
    );

    await this.runCommand(
      ffmpegBinary,
      preservationArgs,
    );

    const preservationFileSha256 =
      await this.hashFileSha256(
        preservationPath,
      );

    const preservationCanonical =
      await this.hashCanonicalVideoContent(
        preservationPath,
      );

    if (
      preservationCanonical.video
        .codec_name !== 'ffv1'
    ) {
      throw new Error(
        `Expected FFV1 preservation video but FFprobe detected ${
          preservationCanonical.video
            .codec_name || 'unknown codec'
        }`,
      );
    }

    if (sourceCanonical.audio) {
      if (
        !preservationCanonical.audio ||
        preservationCanonical.audio
          .codec_name !== 'flac'
      ) {
        throw new Error(
          `Expected FLAC preservation audio but FFprobe detected ${
            preservationCanonical.audio
              ?.codec_name || 'no audio'
          }`,
        );
      }
    } else if (
      preservationCanonical.audio
    ) {
      throw new Error(
        'Unexpected audio stream in preservation master',
      );
    }

    const canonicalVideoMatches =
      sourceCanonical.video.scheme ===
        preservationCanonical.video.scheme &&
      sourceCanonical.video.display_width ===
        preservationCanonical.video
          .display_width &&
      sourceCanonical.video.display_height ===
        preservationCanonical.video
          .display_height &&
      sourceCanonical.video.frame_count ===
        preservationCanonical.video
          .frame_count &&
      sourceCanonical.video.raw_bytes ===
        preservationCanonical.video
          .raw_bytes &&
      sourceCanonical.video.content_sha256 ===
        preservationCanonical.video
          .content_sha256;

    const canonicalAudioMatches =
      sourceCanonical.audio === null
        ? preservationCanonical.audio === null
        : preservationCanonical.audio !==
            null &&
          sourceCanonical.audio.scheme ===
            preservationCanonical.audio
              .scheme &&
          sourceCanonical.audio.sample_rate ===
            preservationCanonical.audio
              .sample_rate &&
          sourceCanonical.audio.channels ===
            preservationCanonical.audio
              .channels &&
          sourceCanonical.audio
            .channel_layout ===
            preservationCanonical.audio
              .channel_layout &&
          sourceCanonical.audio.pcm_bytes ===
            preservationCanonical.audio
              .pcm_bytes &&
          sourceCanonical.audio
            .content_sha256 ===
            preservationCanonical.audio
              .content_sha256;

    const canonicalContentMatches =
      sourceCanonical.scheme ===
        preservationCanonical.scheme &&
      sourceCanonical.content_sha256 ===
        preservationCanonical
          .content_sha256 &&
      canonicalVideoMatches &&
      canonicalAudioMatches;

    if (!canonicalContentMatches) {
      throw new Error(
        'Source/preservation canonical audiovisual verification failed',
      );
    }

    const playbackArgs = [
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      sourcePath,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0?',
      '-map_metadata',
      '-1',
      '-map_chapters',
      '-1',
      '-fps_mode',
      'passthrough',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '18',
      '-vf',
      'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      '-pix_fmt',
      'yuv420p',
    ];

    if (sourceCanonical.audio) {
      playbackArgs.push(
        '-c:a',
        'aac',
        '-b:a',
        '192k',
      );
    } else {
      playbackArgs.push('-an');
    }

    playbackArgs.push(
      '-movflags',
      '+faststart',
      playbackPath,
    );

    await this.runCommand(
      ffmpegBinary,
      playbackArgs,
    );

    const playbackFileSha256 =
      await this.hashFileSha256(playbackPath);

    const playbackVideo =
      await this.probeVideoStream(
        playbackPath,
      );

    if (
      playbackVideo.codec_name !== 'h264'
    ) {
      throw new Error(
        `Expected H.264 playback video but FFprobe detected ${playbackVideo.codec_name || 'unknown codec'}`,
      );
    }

    if (
      playbackVideo.pix_fmt !== 'yuv420p'
    ) {
      throw new Error(
        `Expected yuv420p playback video but FFprobe detected ${playbackVideo.pix_fmt || 'unknown pixel format'}`,
      );
    }

    const playbackHasAudio =
      await this.hasAudioStream(playbackPath);

    if (sourceCanonical.audio) {
      if (!playbackHasAudio) {
        throw new Error(
          'Playback proxy is missing audio',
        );
      }

      const playbackAudio =
        await this.probeAudioStream(
          playbackPath,
        );

      if (
        playbackAudio.codec_name !== 'aac'
      ) {
        throw new Error(
          `Expected AAC playback audio but FFprobe detected ${playbackAudio.codec_name || 'unknown codec'}`,
        );
      }
    } else if (playbackHasAudio) {
      throw new Error(
        'Unexpected audio stream in playback proxy',
      );
    }

    await this.storageProvider.uploadFile(
      preservationPath,
      preservationFilename,
      derivativeFolder,
    );

    await this.storageProvider.uploadFile(
      playbackPath,
      playbackFilename,
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
        content_sha256:
          sourceCanonical.content_sha256,
        content_hash_scheme:
          sourceCanonical.scheme,
        derived_from_id: null,
      });

    await this.mediaArtifactsRepository.saveArtifact({
      digital_asset_id: digitalAsset.id,
      role: MediaArtifactRole.Preservation,
      storage_key: this.buildStorageKey(
        preservationFilename,
        derivativeFolder,
      ),
      mimetype: 'video/x-matroska',
      file_sha256: preservationFileSha256,
      content_sha256:
        preservationCanonical
          .content_sha256,
      content_hash_scheme:
        preservationCanonical.scheme,
      derived_from_id: sourceArtifact.id,
    });

    await this.mediaArtifactsRepository.saveArtifact({
      digital_asset_id: digitalAsset.id,
      role: MediaArtifactRole.Playback,
      storage_key: this.buildStorageKey(
        playbackFilename,
        derivativeFolder,
      ),
      mimetype: 'video/mp4',
      file_sha256: playbackFileSha256,
      content_sha256: null,
      content_hash_scheme: null,
      derived_from_id: sourceArtifact.id,
    });

    await this.contentClaimsRepository.claimFirst({
      content_sha256:
        sourceCanonical.content_sha256,
      content_hash_scheme:
        sourceCanonical.scheme,
      first_digital_asset_id:
        digitalAsset.id,
      first_user_id:
        digitalAsset.user_id || null,
      first_source_file_sha256:
        sourceFileSha256,
      first_seen_at:
        digitalAsset.created_at,
    });

    digitalAsset.media_derivative_prefix =
      derivativeFolder;

    digitalAsset.media_frame_count = null;
  }

  public async execute({ sync_id }: IRequest): Promise<DigitalAsset> {
    const digitalAsset =
      await this.digitalAssetsRepository.findBySyncId(sync_id);

    if (!digitalAsset) {
      throw new Error('Digital asset not found');
    }

    const isJpeg = JPEG_MIME_TYPES.includes(digitalAsset.mimetype);
    const isVideo = VIDEO_MIME_TYPES.includes(digitalAsset.mimetype);
    const isAudio = AUDIO_MIME_TYPES.includes(digitalAsset.mimetype);

    if (!isJpeg && !isVideo && !isAudio) {
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
      } else if (isAudio) {
        await this.convertAudio(
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
