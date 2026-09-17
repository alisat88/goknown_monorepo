import { RedisOptions } from 'ioredis';

export interface IMessengerSocketConfig {
  redisUrl?: string;
  redisOptions?: RedisOptions;
  channelPrefix: string;
}

export function messengerSocketConfig(
  env: NodeJS.ProcessEnv = process.env,
): IMessengerSocketConfig {
  const config: IMessengerSocketConfig = {
    channelPrefix:
      env.MESSENGER_REDIS_CHANNEL_PREFIX || 'goknown:messenger:socket.io',
  };
  if (env.MESSENGER_REDIS_URL) {
    const url = new URL(env.MESSENGER_REDIS_URL);
    if (!['redis:', 'rediss:'].includes(url.protocol))
      throw new Error('Invalid Messenger Redis protocol');
    config.redisUrl = env.MESSENGER_REDIS_URL;
  } else if (env.MESSENGER_REDIS_SHARED === 'true' && env.REDIS_HOST) {
    // Opt in only after verifying that the existing service is shared by all nodes.
    const port = Number(env.REDIS_PORT || 6379);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('Invalid Redis port');
    config.redisOptions = {
      host: env.REDIS_HOST,
      port,
      username: env.REDIS_USERNAME || undefined,
      password: env.REDIS_PASS || undefined,
      tls: env.REDIS_TLS === 'true' ? {} : undefined,
    };
  } else if (env.NODE_ENV === 'production') {
    throw new Error(
      'Production requires MESSENGER_REDIS_URL or a verified shared REDIS_HOST with MESSENGER_REDIS_SHARED=true',
    );
  }
  return config;
}
