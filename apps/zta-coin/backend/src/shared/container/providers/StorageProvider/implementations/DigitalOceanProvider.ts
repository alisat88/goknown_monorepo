import IStorageProvider from '../models/IStorageProvider';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getType } from 'mime';
import aws, { S3, Endpoint, Credentials } from 'aws-sdk';
import uploadConfig from '@config/upload';
import { v5 as uuidv5 } from 'uuid';

class DigitalOceanProvider implements IStorageProvider {
  private client: S3;
  private spacesEndpoint: Endpoint;
  private credentials: Credentials;
  constructor() {
    this.spacesEndpoint = new aws.Endpoint(
      uploadConfig.config.digitalocean.endpoint,
    );

    this.credentials = new aws.Credentials({
      accessKeyId: process.env.DO_SPACES_KEY || '',
      secretAccessKey: process.env.DO_SPACES_SECRET || '',
    });

    this.client = new aws.S3({
      endpoint: this.spacesEndpoint,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: this.credentials,
    });
  }

  public async saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string } | undefined> {
    const originalPath = path.resolve(uploadConfig.tempFolder, file);
    try {
      // console.log(originalPath);
      const fileContent = await fs.promises.readFile(originalPath);

      const ContentType = getType(originalPath);

      if (!ContentType) {
        throw new Error('File not found.');
      }

      await this.client
        .putObject({
          Bucket: `${uploadConfig.config.digitalocean.bucket}/${folder}`,
          Key: file,
          ACL: 'public-read',
          Body: fileContent,
          ContentType,
          ContentDisposition: `inline; filename=${file}`,
        })
        .promise();

      await fs.promises.unlink(originalPath);

      return { filename: file, mimetype: ContentType };
    } catch (err) {
      console.log(err);
      await fs.promises.unlink(originalPath);
    }
  }

  public async deleteFile(file: string): Promise<void> {}
}

export default DigitalOceanProvider;
