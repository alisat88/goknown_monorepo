import 'reflect-metadata';
import {
  Connection,
  ConnectionOptions,
  createConnection,
  getConnectionManager,
} from 'typeorm';
import 'dotenv/config';
import path from 'path';

import { typeormEntities } from './entities';

const connectionName = 'default';

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production');
  }

  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
  const missing = required.filter(name => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Local database configuration is incomplete: missing ${missing.join(', ')}`,
    );
  }

  return `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}

export function getDatabaseOptions(): ConnectionOptions {
  return {
    name: connectionName,
    type: 'postgres',
    url: resolveDatabaseUrl(),
    synchronize: false,
    dropSchema: false,
    logging: false,
    entities: typeormEntities,
    migrations: [path.resolve(__dirname, 'zta-migrations', '*.{js,ts}')],
    migrationsTableName: 'zta_typeorm_migrations',
    cli: {
      migrationsDir: './src/shared/infra/typeorm/zta-migrations',
    },
    cache: false,
  };
}

export async function initializeDatabase(): Promise<Connection> {
  const manager = getConnectionManager();

  if (manager.has(connectionName)) {
    const existing = manager.get(connectionName);
    if (existing.isConnected) {
      return existing;
    }
  }

  const connection = await createConnection(getDatabaseOptions());
  console.log('ZTA database connected');
  return connection;
}

export function getDatabaseConnection(): Connection | undefined {
  const manager = getConnectionManager();
  return manager.has(connectionName) ? manager.get(connectionName) : undefined;
}

export async function isDatabaseReady(): Promise<boolean> {
  const connection = getDatabaseConnection();
  if (!connection || !connection.isConnected) {
    return false;
  }

  try {
    await connection.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
