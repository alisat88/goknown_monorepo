import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import AppError from '@shared/errors/AppError';

import { IChecksumDTO } from '../dtos/IChecksumDTO';
import IChecksumProvider from '../models/IChecksumProvider';
import uploadConfig from '@config/upload';

class ChecksumProvider implements IChecksumProvider {
  constructor() {}

  public async generate({
    filename,
    algorithm,
    encoding,
  }: IChecksumDTO): Promise<string> {
    const originalPath = path.resolve(uploadConfig.tempFolder, filename);
    try {
      const fileContent = await fs.promises.readFile(originalPath);

      if (!fileContent) {
        throw new AppError('File not found');
      }

      return crypto
        .createHash(algorithm || 'md5')
        .update(fileContent.toString(), 'utf8')
        .digest(encoding || 'hex');
    } catch (err) {
      throw new AppError('Error on generate file token', err.message);
    }
  }
}

export default ChecksumProvider;
