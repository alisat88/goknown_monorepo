import uploadConfig from '@config/upload';
import DigitalAsset from '../infra/typeorm/entities/DigitalAsset';

describe('DigitalAsset asset URL', () => {
  const originalDriver = uploadConfig.driver;
  const originalPublicUrl = uploadConfig.config.aws.publicUrl;
  const originalKeyPrefix = uploadConfig.config.aws.keyPrefix;

  beforeEach(() => {
    uploadConfig.driver = 's3';
    uploadConfig.config.aws.publicUrl = 'https://assets.example.test/';
    uploadConfig.config.aws.keyPrefix = 'nfts';
  });

  afterAll(() => {
    uploadConfig.driver = originalDriver;
    uploadConfig.config.aws.publicUrl = originalPublicUrl;
    uploadConfig.config.aws.keyPrefix = originalKeyPrefix;
  });

  it('uses the configured object-storage public URL and key prefix', () => {
    const asset = new DigitalAsset();
    asset.filename = 'stored file.pdf';

    expect(asset.getAssetUrl()).toBe(
      'https://assets.example.test/nfts/stored%20file.pdf',
    );
  });

  it.each([
    'https://old-node.example.test/files/stored%20file.pdf',
    '/files/stored file.pdf',
    'uploads/stored file.pdf',
    'nfts/stored file.pdf',
  ])('normalizes legacy filename value %s', filename => {
    const asset = new DigitalAsset();
    asset.filename = filename;

    expect(asset.getAssetUrl()).toBe(
      'https://assets.example.test/nfts/stored%20file.pdf',
    );
  });
});
