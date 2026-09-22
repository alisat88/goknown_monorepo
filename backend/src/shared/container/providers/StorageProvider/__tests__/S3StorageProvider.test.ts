import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import uploadConfig from '@config/upload';
import S3StorageProvider from '../implementations/S3StorageProvider';

describe('S3StorageProvider', () => {
  const promise = jest.fn().mockResolvedValue(undefined);
  const putObject = jest.fn(() => ({ promise }));
  const getObject = jest.fn(() => ({
    createReadStream: () =>
      Readable.from([Buffer.from('downloaded-file')]),
  }));
  const deleteObject = jest.fn(() => ({ promise }));
  const client = { putObject, getObject, deleteObject } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    uploadConfig.config.aws.bucket = 'test-bucket';
    uploadConfig.config.aws.keyPrefix = 'nfts';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads to the requested prefix and removes the temporary file', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('pdf'));
    const unlink = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);
    const provider = new S3StorageProvider(client);

    await expect(provider.saveFile('asset.pdf', 'nfts')).resolves.toEqual({
      filename: 'asset.pdf',
      mimetype: 'application/pdf',
    });

    expect(putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'test-bucket',
        Key: 'nfts/asset.pdf',
        Body: Buffer.from('pdf'),
        ContentType: 'application/pdf',
      }),
    );
    expect(unlink).toHaveBeenCalledTimes(1);
  });

  it('does not remove the temporary file when upload fails', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('pdf'));
    const unlink = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);
    promise.mockRejectedValueOnce(new Error('upload failed'));
    const provider = new S3StorageProvider(client);

    await expect(provider.saveFile('asset.pdf', 'nfts')).rejects.toThrow(
      'upload failed',
    );
    expect(unlink).not.toHaveBeenCalled();
  });

  it('downloads from the requested prefix into a local destination', async () => {
    const tempDirectory = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'goknown-storage-test-'),
    );
    const destination = path.join(tempDirectory, 'video.mp4');
    const provider = new S3StorageProvider(client);

    try {
      await provider.downloadFile(
        'video.mp4',
        destination,
        'nfts',
      );

      expect(getObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'nfts/video.mp4',
      });

      const downloaded = await fs.promises.readFile(destination);

      expect(downloaded).toEqual(
        Buffer.from('downloaded-file'),
      );
    } finally {
      await fs.promises.rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  it('deletes the same prefixed object key used for upload', async () => {
    const provider = new S3StorageProvider(client);

    await provider.deleteFile('asset.pdf');

    expect(deleteObject).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'nfts/asset.pdf',
    });
  });
});
