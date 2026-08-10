import uploadConfig from '@config/upload';
import DigitalAsset from '../infra/typeorm/entities/DigitalAsset';

describe('DigitalAsset asset URL', () => {
  it('uses the configured object-storage public URL and key prefix', () => {
    const originalDriver = uploadConfig.driver;
    const originalPublicUrl = uploadConfig.config.aws.publicUrl;
    const originalKeyPrefix = uploadConfig.config.aws.keyPrefix;
    uploadConfig.driver = 's3';
    uploadConfig.config.aws.publicUrl = 'https://assets.example.test/';
    uploadConfig.config.aws.keyPrefix = 'nfts';

    const asset = new DigitalAsset();
    asset.filename = 'stored file.pdf';

    expect(asset.getAssetUrl()).toBe(
      'https://assets.example.test/nfts/stored%20file.pdf',
    );

    uploadConfig.driver = originalDriver;
    uploadConfig.config.aws.publicUrl = originalPublicUrl;
    uploadConfig.config.aws.keyPrefix = originalKeyPrefix;
  });
});
