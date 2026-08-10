import path from 'path';
import crypto from 'crypto';
import multer, { StorageEngine } from 'multer';
import { ErrorRequestHandler, NextFunction } from 'express';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

interface IUploadConfig {
  driver: 's3' | 'disk' | 'digitalocean';
  tempFolder: string;
  uploadsFolder: string;

  multer: {
    storage: StorageEngine;
  };

  config: {
    disk: {};
    aws: {
      bucket: string;
      endpoint?: string;
      publicUrl?: string;
      keyPrefix: string;
      region: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    };
    digitalocean: {
      endpoint: string;
      bucket: string;
    };
  };
}

export default {
  driver: process.env.STORAGE_DRIVER || 'disk',

  tempFolder: tmpFolder,
  uploadsFolder: path.resolve(tmpFolder, 'uploads'),

  multer: {
    storage: multer.diskStorage({
      destination: tmpFolder,
      filename(request, file, callback) {
        const fileHash = crypto.randomBytes(10).toString('hex');
        const fileName = `${fileHash}-${file.originalname}`;
        console.log(fileName);
        return callback(null, fileName);
      },
    }),
    onError: function (err: ErrorRequestHandler, next: NextFunction) {
      console.log('error', err);
      next(err);
    },
  },

  config: {
    disk: {},
    aws: {
      bucket:
        process.env.S3_BUCKET ||
        process.env.AWS_BUCKET_NAME ||
        process.env.DO_SPACES_BUCKET ||
        '',
      endpoint: process.env.S3_ENDPOINT || process.env.DO_SPACES_ENDPOINT,
      publicUrl: process.env.S3_PUBLIC_URL || process.env.DO_SPACE_URL,
      keyPrefix: process.env.S3_KEY_PREFIX || 'nfts',
      region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.DO_SPACES_KEY,
      secretAccessKey:
        process.env.S3_SECRET_ACCESS_KEY || process.env.DO_SPACES_SECRET,
    },
    digitalocean: {
      endpoint: process.env.DO_SPACES_ENDPOINT || '',
      bucket: process.env.DO_SPACES_BUCKET || '',
    },
  },
} as IUploadConfig;
