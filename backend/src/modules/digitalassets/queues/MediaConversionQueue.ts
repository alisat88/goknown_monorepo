import Bee from 'bee-queue';

import redisConfig from '@config/redis';

export const MEDIA_QUEUE_NAME = 'goknown-media-conversion';

interface IMediaJob {
  sync_id: string;
}

function mediaRedisConfig(): string | object {
  const redisUrl =
    process.env.MEDIA_REDIS_URL ||
    process.env.MESSENGER_REDIS_URL;

  if (redisUrl) {
    return redisUrl;
  }

  if (redisConfig.host && redisConfig.port) {
    return {
      host: redisConfig.host,
      port: Number(redisConfig.port),
      password: redisConfig.password,
    };
  }

  throw new Error(
    'Media conversion Redis is not configured. Set MEDIA_REDIS_URL.',
  );
}

let producerQueue: Bee | null = null;

function withQueueTimeout<T>(
  promise: Promise<T>,
  operation: string,
): Promise<T> {
  const configured = Number(
    process.env.MEDIA_QUEUE_TIMEOUT_MS || 5000,
  );
  const timeoutMs = Math.min(
    Math.max(
      Number.isFinite(configured) ? configured : 5000,
      1000,
    ),
    30000,
  );

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Media queue ${operation} timed out after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function createMediaWorkerQueue(): Bee {
  return new Bee(MEDIA_QUEUE_NAME, {
    prefix: 'goknown-media',
    redis: mediaRedisConfig(),
    removeOnSuccess: true,
    removeOnFailure: false,
    storeJobs: false,
  });
}

function getProducerQueue(): Bee {
  if (!producerQueue) {
    producerQueue = new Bee(MEDIA_QUEUE_NAME, {
      prefix: 'goknown-media',
      redis: mediaRedisConfig(),
      isWorker: false,
      getEvents: false,
      sendEvents: false,
      storeJobs: false,
      removeOnSuccess: true,
    });

    producerQueue.on('error', error => {
      console.error(
        'Media producer queue error:',
        error instanceof Error ? error.message : error,
      );
    });
  }

  return producerQueue;
}

export async function enqueueMediaConversion(
  sync_id: string,
): Promise<void> {
  const queue = getProducerQueue();

  await withQueueTimeout(
    queue.ready(),
    'connection',
  );

  const job = queue
    .createJob({ sync_id } as IMediaJob)
    .setId(sync_id)
    .retries(2);

  await withQueueTimeout(
    job.save(),
    'enqueue',
  );
}
