/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
      bucket: process.env.AWS_BUCKET_NAME || '',
    },
    digitalocean: {
      endpoint: process.env.DO_SPACES_ENDPOINT || '',
      bucket: process.env.DO_SPACES_BUCKET || '',
    },
  },
} as IUploadConfig;
