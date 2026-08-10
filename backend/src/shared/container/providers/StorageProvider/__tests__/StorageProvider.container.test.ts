import 'reflect-metadata';

describe('StorageProvider container registration', () => {
  const originalStorageDriver = process.env.STORAGE_DRIVER;

  afterEach(() => {
    if (originalStorageDriver === undefined) {
      delete process.env.STORAGE_DRIVER;
    } else {
      process.env.STORAGE_DRIVER = originalStorageDriver;
    }
    jest.resetModules();
  });

  it('resolves the S3 provider and CreateDigitalAssetsService', () => {
    process.env.STORAGE_DRIVER = 's3';
    jest.resetModules();

    jest.isolateModules(() => {
      const { container } = require('tsyringe');
      require('..');

      container.registerInstance('ChecksumProvider', {});
      container.registerInstance('DigitalAssetsRepository', {});
      container.registerInstance('UsersRepository', {});
      container.registerInstance('FoldersRepository', {});
      container.registerInstance('OrganizationsRoomsRepository', {});

      const S3StorageProvider = require('../implementations/S3StorageProvider')
        .default;
      const CreateDigitalAssetsService = require('@modules/digitalassets/services/CreateDigitalAssetsService')
        .default;

      const storageProvider = container.resolve('StorageProvider');
      const service = container.resolve(CreateDigitalAssetsService);

      expect(storageProvider).toBeInstanceOf(S3StorageProvider);
      expect(service).toBeInstanceOf(CreateDigitalAssetsService);
      expect(container.resolve('StorageProvider')).toBe(storageProvider);
    });
  });
});
