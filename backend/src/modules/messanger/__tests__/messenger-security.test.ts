import 'reflect-metadata';
import { container } from 'tsyringe';
import { sign } from 'jsonwebtoken';
import authConfig from '@config/auth';
import {
  authenticateSocket,
  SocketServer,
  userRoom,
} from '@shared/infra/http/socketIO';
import CreateNewConversationService from '../services/CreateNewConversationService';
import CreateNewMessageService from '../services/CreateNewMessageService';
import ListAllUserMessagesService from '../services/ListAllUserMessagesService';
import MessagesRepository from '../infra/typeorm/repositories/MessagesRepository';
import * as typeorm from 'typeorm';
jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  getRepository: jest.fn(),
}));

const conversation = () => ({
  id: 'id',
  sync_id: 'chat',
  members: ['a', 'b', 'c'],
  unread: [0, 0, 0],
  messages: [],
  updated_at: new Date(),
});
const users: any = {
  findBySyncId: jest.fn(async (id: string) => ({
    sync_id: id,
    status: 'active',
  })),
};

afterEach(() => jest.restoreAllMocks());

test('direct conversation creation preserves two members', async () => {
  const repo: any = { create: jest.fn(async (data: any) => data) };
  await expect(
    new CreateNewConversationService(repo, users).execute({
      sender_id: 'a',
      receiver_id: 'b',
      sync_id: 'chat',
    }),
  ).resolves.toMatchObject({ members: ['a', 'b'] });
});

test('read and write reject nonmembers before persistence or read acknowledgement', async () => {
  const repo: any = { findBySyncId: async () => conversation() };
  const messages: any = { create: jest.fn(), findAll: jest.fn() };
  await expect(
    new CreateNewMessageService(repo, messages, users).execute({
      sender: 'outsider',
      conversation_syncid: 'chat',
      text: 'forged',
    }),
  ).rejects.toMatchObject({ statusCode: 403 });
  await expect(
    new ListAllUserMessagesService(repo, users, messages).execute({
      usersync_id: 'outsider',
      conversation_syncid: 'chat',
    }),
  ).rejects.toMatchObject({ statusCode: 403 });
  expect(messages.create).not.toHaveBeenCalled();
  expect(messages.findAll).not.toHaveBeenCalled();
});

test.each([
  ['a', 'b'],
  ['a', 'b', 'c'],
])('delivery persists identity and targets other members: %j', (...members) => {
  const server = new SocketServer();
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  (server as any).io = { to };
  const message = {
    id: 'message',
    conversation_syncid: 'chat',
    sender: 'a',
    text: "I'm testing Bob's aircraft",
    created_at: 'now',
  };
  server.messageCreated(message, members);
  const deliveries = emit.mock.calls.filter(call => call[0] === 'getMessage');
  expect(deliveries).toHaveLength(members.length - 1);
  deliveries.forEach(call =>
    expect(call[1]).toEqual({ ...message, conversation_id: 'chat' }),
  );
  members
    .slice(1)
    .forEach(member => expect(to).toHaveBeenCalledWith(userRoom(member)));
});

test('socket rejects missing/invalid JWT and derives identity only from verified subject', async () => {
  jest.spyOn(container, 'resolve').mockReturnValue(users);
  for (const token of [undefined, 'forged']) {
    const next = jest.fn();
    await authenticateSocket(
      { handshake: { auth: { token, sync_id: 'b' } }, data: {} } as any,
      next,
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  }
  const socket: any = {
    handshake: {
      auth: {
        token: sign({}, authConfig.jwt.secret, {
          subject: 'a',
          expiresIn: '1h',
        }),
        sync_id: 'b',
      },
    },
    data: {},
  };
  const next = jest.fn();
  await authenticateSocket(socket, next);
  expect(next).toHaveBeenCalledWith();
  expect(socket.data.usersync_id).toBe('a');
});

test('parameterized append persists once; unread increments recipients and read clears only reader', async () => {
  const row: any = conversation();
  let values: any;
  let parameter: any;
  const query: any = {
    update: () => query,
    set: (v: any) => {
      values = v;
      return query;
    },
    where: () => query,
    setParameter: (key: string, value: string) => {
      parameter = { key, value };
      return query;
    },
    execute: jest.fn(async () => {
      row.messages.push(JSON.parse(parameter.value));
      row.unread = values.unread;
    }),
  };
  const repository: any = {
    findOne: jest.fn(async () => row),
    createQueryBuilder: () => query,
    update: jest.fn(async (_id: string, value: any) => {
      row.unread = value.unread;
    }),
  };
  jest.spyOn(typeorm, 'getRepository').mockReturnValue({
    manager: {
      transaction: async (fn: any) => fn({ getRepository: () => repository }),
    },
  } as any);
  const messages = new MessagesRepository();
  const text = "I'm testing Bob's aircraft'); DROP TABLE conversations; --";
  const saved = await messages.create({
    conversation_syncid: 'chat',
    sender: 'a',
    text,
  });
  expect(query.execute).toHaveBeenCalledTimes(1);
  expect(values.messages()).not.toContain(text);
  expect(parameter.key).toBe('message');
  expect(JSON.parse(parameter.value).text).toBe(text);
  expect(row.unread).toEqual([0, 1, 1]);
  await expect(messages.findAll('chat', 'b')).resolves.toEqual([saved]);
  expect(row.unread).toEqual([0, 0, 1]);
  expect(repository.findOne).toHaveBeenCalledWith(
    expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
  );
  await expect(messages.findAll('chat', 'outsider')).rejects.toMatchObject({
    statusCode: 403,
  });
});
