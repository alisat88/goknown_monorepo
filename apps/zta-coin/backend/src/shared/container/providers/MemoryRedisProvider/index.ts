import { container } from 'tsyringe';

import IMemoryRedisProvider from './models/IMemoryRedisProvider';
import MemoryRedisProvider from './implementations/MemoryRedisProvider';

const providers = {
  redis: MemoryRedisProvider,
};

container.registerSingleton<IMemoryRedisProvider>(
  'MemoryRedisProvider',
  providers.redis,
);
