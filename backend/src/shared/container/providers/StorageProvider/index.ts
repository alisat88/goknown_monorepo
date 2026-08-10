import { container, instanceCachingFactory } from 'tsyringe';
import uploadConfig from '@config/upload';

import IStorageProvider from './models/IStorageProvider';
import DiskStorageProvider from './implementations/DiskStorageProvider';
import S3StorageProvider from './implementations/S3StorageProvider';

const providers = {
  disk: DiskStorageProvider,
  s3: S3StorageProvider,
  digitalocean: S3StorageProvider,
};

const StorageProvider = providers[uploadConfig.driver];

container.register<IStorageProvider>('StorageProvider', {
  useFactory: instanceCachingFactory(() => new StorageProvider()),
});
