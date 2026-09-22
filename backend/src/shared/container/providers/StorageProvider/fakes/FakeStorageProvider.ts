import fs from 'fs';
import path from 'path';
import IStorageProvider from '../models/IStorageProvider';

class FakeStorageProvider implements IStorageProvider {
  private storage: string[] = [];

  private storageKey(file: string, folder?: string): string {
    return folder ? `${folder}/${file}` : file;
  }

  public async saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }> {
    this.storage.push(this.storageKey(file, folder));
    return { filename: file, mimetype: '' };
  }

  public async downloadFile(
    file: string,
    destination: string,
    folder?: string,
  ): Promise<void> {
    const key = this.storageKey(file, folder);

    if (!this.storage.includes(key)) {
      throw new Error(`File not found in fake storage: ${key}`);
    }

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.writeFile(destination, Buffer.alloc(0));
  }

  public async uploadFile(
    sourcePath: string,
    filename: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }> {
    await fs.promises.stat(sourcePath);
    this.storage.push(this.storageKey(filename, folder));

    return { filename, mimetype: '' };
  }

  public async deleteFile(file: string, folder?: string): Promise<void> {
    const key = this.storageKey(file, folder);
    const findIndex = this.storage.findIndex(storageFile => storageFile === key);

    if (findIndex >= 0) {
      this.storage.splice(findIndex, 1);
    }
  }
}

export default FakeStorageProvider;
