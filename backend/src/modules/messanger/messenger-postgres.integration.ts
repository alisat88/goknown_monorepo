// Run explicitly with Jest --testMatch '**/messenger-postgres.integration.ts'.
// Uses only a connection-local TEMP table on the configured localhost development DB.
import 'reflect-metadata';
import { readFileSync } from 'fs';
const { parse }: { parse: (source: Buffer) => Record<string, string> } = require('dotenv');
import { Connection, createConnection } from 'typeorm';
import { v4 } from 'uuid';
import Conversation from './infra/typeorm/entities/Conversation';
import MessagesRepository from './infra/typeorm/repositories/MessagesRepository';
import ConversationsRepository from './infra/typeorm/repositories/ConversationsRepository';

let connection: Connection;
let messages: MessagesRepository;
let conversations: ConversationsRepository;
const sender = v4(),
  recipient = v4(),
  third = v4();

beforeAll(async () => {
  const env = parse(readFileSync('.env'));
  const url = env.DATABASE_URL ? new URL(env.DATABASE_URL) : undefined;
  const hostname = url?.hostname || env.DB_HOST;
  if (
    !['localhost', '127.0.0.1', '::1'].includes(hostname) ||
    env.NODE_ENV !== 'development'
  ) {
    throw new Error(
      'This integration test requires a localhost development database',
    );
  }
  connection = await createConnection({
    name: 'default',
    type: 'postgres',
    ...(url
      ? { url: env.DATABASE_URL }
      : {
          host: env.DB_HOST,
          port: Number(env.DB_PORT),
          username: env.DB_USER,
          password: env.DB_PASS,
          database: env.DB_NAME,
        }),
    entities: [Conversation],
    synchronize: false,
    migrationsRun: false,
    installExtensions: false,
    extra: { max: 1, connectionTimeoutMillis: 3000 },
  });
  // Never create, alter, or clear a permanent application table.
  await connection.query(`CREATE TEMP TABLE conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sync_id uuid NOT NULL,
    members jsonb NOT NULL, unread jsonb NOT NULL, messages jsonb[],
    type varchar NOT NULL DEFAULT 'direct', name varchar, created_by uuid,
    created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(), deleted_at timestamp
  )`);
  messages = new MessagesRepository();
  conversations = new ConversationsRepository();
});
afterAll(async () => {
  if (connection?.isConnected) await connection.close();
});

test.each([2, 3])(
  'PostgreSQL persists apostrophes once, reloads history and maintains unread for %i members',
  async size => {
    const members = [sender, recipient, third].slice(0, size);
    const chat = await conversations.create({
      members,
      sync_id: v4(),
      type: size === 3 ? 'group' : 'direct',
      name: 'Test',
    });
    expect(chat.unread).toEqual(members.map(() => 0));
    const text = "I'm testing Bob's aircraft'); SELECT pg_sleep(99); --";
    const message = await messages.create({
      conversation_syncid: chat.sync_id,
      sender,
      text,
    });
    let saved = await conversations.findBySyncId(chat.sync_id);
    expect(saved?.messages).toEqual([message]);
    expect(saved?.unread).toEqual(
      members.map(member => (member === sender ? 0 : 1)),
    );
    await expect(messages.findAll(chat.sync_id, recipient)).resolves.toEqual([
      message,
    ]);
    saved = await conversations.findBySyncId(chat.sync_id);
    expect(saved?.unread).toEqual(size === 3 ? [0, 0, 1] : [0, 0]);
    await expect(messages.findAll(chat.sync_id, v4())).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(
      messages.create({
        conversation_syncid: chat.sync_id,
        sender: v4(),
        text: 'forged',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(
      (await conversations.findAll([sender])).some(
        row => row.sync_id === chat.sync_id,
      ),
    ).toBe(true);
  },
);

test('overlapping sends cannot lose history or unread updates', async () => {
  const chat = await conversations.create({
    members: [sender, recipient, third],
    sync_id: v4(),
    type: 'group',
  });
  await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      messages.create({
        conversation_syncid: chat.sync_id,
        sender,
        text: `message ${index}`,
      }),
    ),
  );
  const saved = await conversations.findBySyncId(chat.sync_id);
  expect(saved?.messages).toHaveLength(5);
  expect(saved?.unread).toEqual([0, 5, 5]);
});
