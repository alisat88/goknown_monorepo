import { container } from 'tsyringe';
import SyncNodeProvider from './implementations/SyncNodeProvider';
import ISyncNodeProvider from './models/ISyncNodeProvider';

container.registerSingleton<ISyncNodeProvider>(
  'SyncNodeProvider',
  SyncNodeProvider,
);
