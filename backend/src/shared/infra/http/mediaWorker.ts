import 'reflect-metadata';
import 'dotenv/config';

import '@shared/infra/typeorm';
import '@shared/container';

import { container } from 'tsyringe';
import { getConnectionManager } from 'typeorm';

import ProcessDigitalAssetMediaService from '@modules/digitalassets/services/ProcessDigitalAssetMediaService';
import { createMediaWorkerQueue } from '@modules/digitalassets/queues/MediaConversionQueue';

async function waitForDatabase(): Promise<void> {
  const configured = Number(
    process.env.MEDIA_DB_READY_TIMEOUT_MS || 30000,
  );

  const timeoutMs = Math.min(
    Math.max(
      Number.isFinite(configured) ? configured : 30000,
      5000,
    ),
    120000,
  );

  const startedAt = Date.now();
  const connectionManager = getConnectionManager();

  while (Date.now() - startedAt < timeoutMs) {
    if (connectionManager.has('default')) {
      const connection = connectionManager.get('default');

      if (connection.isConnected) {
        console.log('Media worker database connection is ready');
        return;
      }
    }

    await new Promise(resolve => {
      setTimeout(resolve, 250);
    });
  }

  throw new Error(
    `Database did not become ready within ${timeoutMs}ms`,
  );
}

async function start(): Promise<void> {
  await waitForDatabase();

  const queue = createMediaWorkerQueue();

  queue.on('error', error => {
    console.error('Media queue error:', error);
  });

  queue.on('failed', (job, error) => {
    console.error(
      `Media job ${job.id} failed:`,
      error instanceof Error ? error.message : error,
    );
  });

  queue.on('retrying', (job, error) => {
    console.warn(
      `Media job ${job.id} retrying:`,
      error instanceof Error ? error.message : error,
    );
  });

  queue.on('succeeded', job => {
    console.log(`Media job ${job.id} succeeded`);
  });

  await queue.ready();

  queue.process(async job => {
    const sync_id = job.data && job.data.sync_id;

    if (!sync_id || typeof sync_id !== 'string') {
      throw new Error('Media conversion job is missing sync_id');
    }

    const service = container.resolve(
      ProcessDigitalAssetMediaService,
    );

    await service.execute({ sync_id });

    return { sync_id };
  });

  await queue.checkStalledJobs(5000, error => {
    if (error) {
      console.error('Media stalled-job check failed:', error);
    }
  });

  console.log('Digital Assets media worker is ready');

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Media worker received ${signal}; shutting down`);

    try {
      await queue.close(30000);
      process.exit(0);
    } catch (error) {
      console.error('Media worker shutdown failed:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

start().catch(error => {
  console.error('Media worker startup failed:', error);
  process.exit(1);
});
