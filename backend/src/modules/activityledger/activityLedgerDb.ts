import fs from 'fs';
import { Connection, EntityManager, createConnection, getConnectionManager } from 'typeorm';

const CONNECTION_NAME = 'activity-ledger';
let connectionPromise: Promise<Connection> | undefined;

function connectionOptions() {
  const raw = process.env.ACTIVITY_LEDGER_DATABASE_URL;
  if (!raw) throw new Error('ACTIVITY_LEDGER_DATABASE_URL is required');
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid activity ledger database URL');
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol))
    throw new Error('Invalid activity ledger database URL');
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/')
    throw new Error('Invalid activity ledger database URL');
  if (parsed.search || parsed.hash || !parsed.username || !parsed.password)
    throw new Error('Invalid activity ledger database URL');

  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  const sslDisabled = process.env.ACTIVITY_LEDGER_SSL === 'disable';
  if (sslDisabled && !local)
    throw new Error('Activity ledger TLS cannot be disabled remotely');
  const caFile = process.env.ACTIVITY_LEDGER_CA_FILE;
  const ssl = sslDisabled
    ? false
    : {
        rejectUnauthorized: true,
        ...(caFile ? { ca: fs.readFileSync(caFile, 'utf8') } : {}),
      };

  return {
    name: CONNECTION_NAME,
    type: 'postgres' as const,
    url: raw,
    schema: 'activity_ledger',
    entities: [],
    migrations: [],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    ssl,
    applicationName: 'dappgenius-activity-ledger',
    connectionTimeoutMillis: 10000,
    extra: { query_timeout: 30000 },
    options: '-c search_path=activity_ledger,pg_catalog',
  };
}

export async function getActivityLedgerManager(): Promise<EntityManager> {
  const manager = getConnectionManager();
  if (manager.has(CONNECTION_NAME)) {
    const connection = manager.get(CONNECTION_NAME);
    if (!connection.isConnected) await connection.connect();
    return connection.manager;
  }
  if (!connectionPromise) connectionPromise = createConnection(connectionOptions());
  return (await connectionPromise).manager;
}

export async function closeActivityLedgerConnection(): Promise<void> {
  if (!connectionPromise) return;
  const connection = await connectionPromise.catch(() => undefined);
  connectionPromise = undefined;
  if (connection?.isConnected) await connection.close();
}
