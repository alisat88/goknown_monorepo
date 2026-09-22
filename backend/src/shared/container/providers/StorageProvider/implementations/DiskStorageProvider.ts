import fs from 'fs';
import path from 'path';
import mime from 'mime';
import uploadConfig from '@config/upload';
import IStorageProvider from '../models/IStorageProvider';

class DiskStorageProvider implements IStorageProvider {
  private storagePath(file: string, folder?: string): string {
    return folder
      ? path.resolve(uploadConfig.uploadsFolder, folder, file)
      : path.resolve(uploadConfig.uploadsFolder, file);
  }

  public async saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }> {
    const source = path.resolve(uploadConfig.tempFolder, file);
    const destination = this.storagePath(file, folder);

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.rename(source, destination);

    return { filename: file, mimetype: mime.getType(file) || '' };
  }

  public async downloadFile(
    file: string,
    destination: string,
    folder?: string,
  ): Promise<void> {
    const source = this.storagePath(file, folder);

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(source, destination);
  }

  public async uploadFile(
    sourcePath: string,
    filename: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }> {
    const destination = this.storagePath(filename, folder);

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(sourcePath, destination);

    return { filename, mimetype: mime.getType(filename) || '' };
  }

  public async deleteFile(file: string, folder?: string): Promise<void> {
    const filePath = this.storagePath(file, folder);

    try {
      await fs.promises.stat(filePath);
    } catch {
      return;
    }

    await fs.promises.unlink(filePath);
  }
}

export default DiskStorageProvider;
