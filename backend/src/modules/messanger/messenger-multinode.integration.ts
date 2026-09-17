// Requires local Docker and a backend build. Creates ONLY disposable containers.
import 'reflect-metadata';
import { execFileSync, fork, ChildProcess } from 'child_process';
import { createServer, Server } from 'http';
import { resolve } from 'path';
const { Client } = require('pg');
import { sign } from 'jsonwebtoken';
import { v4 } from 'uuid';
import axios from 'axios';
const { io } = require(require.resolve('socket.io-client', {
  paths: [resolve(process.cwd(), '../frontend')],
}));

jest.setTimeout(240000);
const run = v4();
const names = [`messenger-test-redis-${run}`, `messenger-test-pg-${run}`];
const users = ['alice', 'bob', 'carol', 'outsider'].map(name => ({
  sync_id: v4(),
  name,
  email: `${name}@example.com`,
  status: 'active',
}));
const secret = v4();
const workers: ChildProcess[] = [];
const clients: any[] = [];
const inboxes: Record<string, any[]> = {};
const urls: string[] = [];
let database: any;
let peerTrap: Server;
let peerWrites = 0;
const docker = (...args: string[]) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    timeout: 160000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check: () => boolean, description: string): Promise<void> {
  const deadline = Date.now() + 30000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${description}`);
    await delay(25);
  }
}
const headers = (user = users[0]) => ({
  Authorization: `Bearer ${sign({}, secret, {
    subject: user.sync_id,
    expiresIn: '1h',
  })}`,
});

beforeAll(async () => {
  docker(
    'run',
    '--rm',
    '-d',
    '--name',
    names[0],
    '-p',
    '127.0.0.1::6379',
    'redis:7-alpine',
    'redis-server',
    '--save',
    '',
    '--appendonly',
    'no',
  );
  docker(
    'run',
    '--rm',
    '-d',
    '--name',
    names[1],
    '-p',
    '127.0.0.1::5432',
    '-e',
    'POSTGRES_PASSWORD=test-only',
    '-e',
    'POSTGRES_DB=messenger_multinode_test',
    'postgres:16-alpine',
  );
  const redisPort = docker('port', names[0], '6379/tcp').split(':').pop();
  const pgPort = docker('port', names[1], '5432/tcp').split(':').pop();
  const databaseUrl = `postgres://postgres:test-only@127.0.0.1:${pgPort}/messenger_multinode_test`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    database = new Client({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 1000,
    });
    try {
      await database.connect();
      break;
    } catch (error: any) {
      await database.end();
      if (attempt === 99) {
        console.error(docker('logs', names[1]));
        throw new Error(`Disposable PostgreSQL did not start (${error.code || error.name})`);
      }
      await delay(200);
    }
  }
  // Disposable database, not an application migration or a production table.
  await database.query(`CREATE TABLE conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sync_id uuid NOT NULL,
    members jsonb NOT NULL, unread jsonb NOT NULL, messages jsonb[],
    type varchar NOT NULL DEFAULT 'direct', name varchar, created_by uuid,
    created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(), deleted_at timestamp
  )`);
  peerTrap = createServer((_req, response) => {
    peerWrites += 1;
    response.end('{}');
  });
  await new Promise<void>(resolve => peerTrap.listen(0, '127.0.0.1', resolve));
  const peerUrl = `http://127.0.0.1:${(peerTrap.address() as any).port}`;
  for (const label of ['a', 'b', 'c']) {
    const worker = fork(
      resolve(
        process.cwd(),
        'dist/modules/messanger/testing/multiNodeWorker.js',
      ),
      [],
      {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          APP_SECRET: secret,
          MESSENGER_TEST_DATABASE_URL: databaseUrl,
          MESSENGER_TEST_USERS: JSON.stringify(users),
          MESSENGER_REDIS_URL: `redis://127.0.0.1:${redisPort}`,
          MESSENGER_REDIS_CHANNEL_PREFIX: `test:${run}`,
          NODES_JSON: JSON.stringify([{ name: 'trap', url: peerUrl }]),
        },
        execArgv: [],
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      },
    );
    workers.push(worker);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`Worker ${label} timeout`)),
        60000,
      );
      worker.once('exit', code => {
        clearTimeout(timeout);
        reject(new Error(`Worker ${label} exited ${code}`));
      });
      worker.on('message', (message: any) => {
        if (message.error) {
          clearTimeout(timeout);
          reject(new Error(message.error));
        }
        if (message.ready) {
          clearTimeout(timeout);
          urls.push(`http://127.0.0.1:${message.port}`);
          resolve();
        }
      });
    });
  }
});
afterAll(async () => {
  clients.forEach(client => client.disconnect());
  await Promise.all(
    workers.map(
      worker =>
        new Promise<void>(resolve => {
          if (worker.exitCode !== null) {
            resolve();
            return;
          }
          const timeout = setTimeout(() => worker.kill(), 3000);
          worker.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
          worker.send('shutdown');
        }),
    ),
  );
  if (database) await database.end();
  if (peerTrap)
    await new Promise<void>(resolve => peerTrap.close(() => resolve()));
  for (const name of names) {
    try {
      docker('stop', name);
    } catch {
      /* A failed setup may not have created it. */
    }
  }
});

async function connect(
  label: string,
  node: number,
  user = users[0],
  authenticated = true,
): Promise<any> {
  const socket = io(urls[node], {
    autoConnect: false,
    reconnection: false,
    transports: ['websocket'],
    auth: authenticated
      ? {
          token: headers(user).Authorization.slice(7),
          sync_id: users[3].sync_id,
        }
      : { sync_id: user.sync_id },
  });
  clients.push(socket);
  inboxes[label] = [];
  socket.on('getMessage', (message: any) => inboxes[label].push(message));
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
  return socket;
}

test('unauthenticated socket is rejected on a different backend process', async () => {
  await expect(connect('invalid', 1, users[0], false)).rejects.toThrow(
    'Authentication required',
  );
});

test('three real processes share authenticated rooms, persist once, and never forward peer writes', async () => {
  const sender = await connect('alice', 0);
  await connect('alice-other-device', 2);
  await connect('bob', 1, users[1]);
  await connect('bob-second-tab', 2, users[1]);
  await connect('carol', 2, users[2]);
  await connect('outsider', 0, users[3]);
  let presence: any[] = [];
  sender.on('getUsers', (value: any[]) => {
    presence = value;
  });
  sender.emit('addUser', users[3].sync_id);
  await until(
    () =>
      users.every(user =>
        presence.some(socket => socket.usersync_id === user.sync_id),
      ),
    'cluster presence',
  );
  expect(
    presence.find(socket => socket.socket_id === sender.id).usersync_id,
  ).toBe(users[0].sync_id);
  const direct = (
    await axios.post(
      `${urls[0]}/conversations`,
      { receiver_id: users[1].sync_id },
      { headers: headers() },
    )
  ).data;
  const directMessage = (
    await axios.post(
      `${urls[0]}/conversations/${direct.sync_id}/messages`,
      {
        text: "I'm testing Bob's aircraft",
        sender: users[3].sync_id,
        receiver_id: users[3].sync_id,
        masterNode: true,
      },
      { headers: headers() },
    )
  ).data;
  await until(
    () => inboxes.bob.length === 1 && inboxes['bob-second-tab'].length === 1,
    'direct cross-node delivery',
  );
  expect(inboxes.bob[0]).toEqual({
    ...directMessage,
    conversation_id: direct.sync_id,
  });
  expect(inboxes.carol).toHaveLength(0);
  const group = (
    await axios.post(
      `${urls[1]}/conversations/group`,
      { name: 'Cross-node team', emails: [users[1].email, users[2].email] },
      { headers: headers() },
    )
  ).data;
  // Sender's socket is on A; the independent HTTP POST is deliberately handled by B.
  const groupMessage = (
    await axios.post(
      `${urls[1]}/conversations/${group.sync_id}/messages`,
      {
        text: 'group from another process',
        sender: users[3].sync_id,
        receiver_id: users[3].sync_id,
      },
      { headers: headers() },
    )
  ).data;
  await until(
    () =>
      inboxes.bob.length === 2 &&
      inboxes['bob-second-tab'].length === 2 &&
      inboxes.carol.length === 1,
    'group cross-node delivery',
  );
  expect(inboxes.carol[0]).toEqual({
    ...groupMessage,
    conversation_id: group.sync_id,
  });
  sender.emit('sendMessage', {
    sender: users[1].sync_id,
    receiver_id: users[2].sync_id,
    text: 'forged',
    conversation_id: group.sync_id,
  });
  await delay(100);
  expect(inboxes.alice).toHaveLength(0);
  expect(inboxes['alice-other-device']).toHaveLength(0);
  expect(inboxes.outsider).toHaveLength(0);
  const rows: any[] = (
    await database.query(
      'SELECT sync_id, messages, unread FROM conversations ORDER BY type',
    )
  ).rows;
  expect(rows).toHaveLength(2);
  for (const row of rows) {
    expect(row.messages).toHaveLength(1);
    expect(row.messages[0].sender).toBe(users[0].sync_id);
  }
  expect(rows.find(row => row.sync_id === direct.sync_id).unread).toEqual([
    0, 1,
  ]);
  expect(rows.find(row => row.sync_id === group.sync_id).unread).toEqual([
    0, 1, 1,
  ]);
  await axios.get(`${urls[2]}/conversations/${group.sync_id}/messages`, {
    headers: headers(users[1]),
  });
  expect(
    (
      await database.query(
        'SELECT unread FROM conversations WHERE sync_id=$1',
        [group.sync_id],
      )
    ).rows[0].unread,
  ).toEqual([0, 0, 1]);
  expect(peerWrites).toBe(0);
});
