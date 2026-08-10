import fs from 'fs';
import path from 'path';
import mime from 'mime';
import aws, { S3 } from 'aws-sdk';
import uploadConfig from '@config/upload';
import IStorageProvider from '../models/IStorageProvider';
class S3StorageProvider implements IStorageProvider {
  private client: S3;

  constructor(client?: S3) {
    if (client) {
      this.client = client;
      return;
    }

    const { endpoint, accessKeyId, secretAccessKey } = uploadConfig.config.aws;
    this.client = new aws.S3({
      region: uploadConfig.config.aws.region,
      endpoint,
      credentials:
        accessKeyId && secretAccessKey
          ? new aws.Credentials({ accessKeyId, secretAccessKey })
          : undefined,
    });
  }

  private objectKey(file: string, folder?: string): string {
    const prefix = folder || uploadConfig.config.aws.keyPrefix;
    return prefix ? `${prefix.replace(/^\/+|\/+$/g, '')}/${file}` : file;
  }

  public async saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }> {
    const originalPath = path.resolve(uploadConfig.tempFolder, file);
    const contentType =
      mime.getType(originalPath) || 'application/octet-stream';
    const fileContent = await fs.promises.readFile(originalPath);

    await this.client
      .putObject({
        Bucket: uploadConfig.config.aws.bucket,
        Key: this.objectKey(file, folder),
        ACL: 'public-read',
        Body: fileContent,
        ContentType: contentType,
        ContentDisposition: `inline; filename="${file.replace(/"/g, '')}"`,
      })
      .promise();

    await fs.promises.unlink(originalPath);

    return { filename: file, mimetype: contentType };
  }

  public async deleteFile(file: string, folder?: string): Promise<void> {
    await this.client
      .deleteObject({
        Bucket: uploadConfig.config.aws.bucket,
        Key: this.objectKey(file, folder),
      })
      .promise();
  }
}

export default S3StorageProvider;
