export default interface IStorageProvider {
  saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string } | undefined>;
  downloadFile(
    file: string,
    destination: string,
    folder?: string,
  ): Promise<void>;
  uploadFile(
    sourcePath: string,
    filename: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }>;
  deleteFile(file: string, folder?: string): Promise<void>;
}
