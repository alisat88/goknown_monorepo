import Redis, { Redis as RedisClient } from 'ioredis';
import memoryConfig from '@config/memory';
import ICacheProvider from '../models/IMemoryRedisProvider';

class MemoryRedisProvider implements ICacheProvider {
  private client: RedisClient;
  constructor() {
    this.client = new Redis(memoryConfig.config.redis);
  }

  public async save(key: string, value: any): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  public async recover<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);

    if (!data) {
      return null;
    }
    const parseData = JSON.parse(data) as T;

    return parseData;
  }

  public async recoverPrefix<T>(prefix: string): Promise<T | []> {
    const keys = await this.client.keys(`${prefix}:*`);
    const parseDataArray = [] as any;
    if (!keys) {
      return [];
    }

    await Promise.all(
      keys.map(async key => {
        const data = (await this.recover(key)) as any;
        parseDataArray.push(data);
      }),
    );

    return parseDataArray;
  }

  public async invalidate(key: string): Promise<void> {
    console.log('invalidate, =>', key);
    await this.client.del(key);
  }

  public async invalidatePrefix(prefix: string): Promise<void> {
    const keys = await this.client.keys(`${prefix}:*`);

    const pipeline = this.client.pipeline();

    keys.forEach(key => {
      pipeline.del(key);
    });

    await pipeline.exec();
  }
}

export default MemoryRedisProvider;
