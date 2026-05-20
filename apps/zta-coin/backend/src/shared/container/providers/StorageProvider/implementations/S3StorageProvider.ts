import fs from 'fs';
import path from 'path';
import mime from 'mime';
import aws, { S3 } from 'aws-sdk';
import uploadConfig from '@config/upload';
import IStorageProvider from '../models/IStorageProvider';
// import sharp from 'sharp';

class DiskStorageProvider implements IStorageProvider {
  private client: S3;
  constructor() {
    this.client = new aws.S3({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  public async saveFile(file: string): Promise<string> {
    const originalPath = path.resolve(uploadConfig.tempFolder, file);

    // const fileContent = await fs.promises.readFile(originalPath);

    // const cropFileContent = await sharp(fileContent)
    //   .resize(512, 512, {
    //     fit: sharp.fit.cover,
    //     position: sharp.gravity.center,
    //     background: { r: 0, g: 0, b: 0, alpha: 0 },
    //   })
    //   .toFormat('jpeg')
    //   .jpeg({
    //     quality: 80,
    //   })
    //   .toBuffer();

    // const ContentType = mime.getType(originalPath);

    // if (!ContentType) {
    //   throw new Error('File not found.');
    // }

    // await this.client
    //   .putObject({
    //     Bucket: uploadConfig.config.aws.bucket,
    //     Key: file,
    //     ACL: 'public-read',
    //     Body: cropFileContent,
    //     ContentType,
    //     ContentDisposition: `inline; filename=${file}`,
    //   })
    //   .promise();
    // await fs.promises.unlink(originalPath);
    return file;
  }

  public async deleteFile(file: string): Promise<void> {
    await this.client
      .deleteObject({
        Bucket: uploadConfig.config.aws.bucket,
        Key: file,
      })
      .promise();
  }
}

export default DiskStorageProvider;
