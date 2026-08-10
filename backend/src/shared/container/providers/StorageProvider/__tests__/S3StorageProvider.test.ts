import fs from 'fs';
import uploadConfig from '@config/upload';
import S3StorageProvider from '../implementations/S3StorageProvider';

describe('S3StorageProvider', () => {
  const promise = jest.fn().mockResolvedValue(undefined);
  const putObject = jest.fn(() => ({ promise }));
  const deleteObject = jest.fn(() => ({ promise }));
  const client = { putObject, deleteObject } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    uploadConfig.config.aws.bucket = 'test-bucket';
    uploadConfig.config.aws.keyPrefix = 'nfts';
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

  it('deletes the same prefixed object key used for upload', async () => {
    const provider = new S3StorageProvider(client);

    await provider.deleteFile('asset.pdf');

    expect(deleteObject).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'nfts/asset.pdf',
    });
  });
});
