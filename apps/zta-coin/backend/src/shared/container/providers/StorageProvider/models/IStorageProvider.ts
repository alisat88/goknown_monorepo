export default interface IStorageProvider {
  saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string } | undefined>;
  deleteFile(file: string): Promise<void>;
}
