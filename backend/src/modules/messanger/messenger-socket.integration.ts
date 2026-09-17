// Explicit local-only wire test; reuses the root frontend's Socket.io client dependency.
import 'reflect-metadata';
import { createServer, Server as HttpServer } from 'http';
import { resolve } from 'path';
import { sign } from 'jsonwebtoken';
import { container } from 'tsyringe';
import authConfig from '@config/auth';
import { SocketServer } from '@shared/infra/http/socketIO';
const { io } = require(require.resolve('socket.io-client', {
  paths: [resolve(process.cwd(), '../frontend')],
}));
let http: HttpServer;
let server: SocketServer;
let url: string;
const clients: any[] = [];
const received: Record<string, any[]> = {};

function client(name: string, auth: any): any {
  const socket = io(url, {
    auth,
    reconnection: false,
    transports: ['websocket'],
    autoConnect: false,
  });
  clients.push(socket);
  received[name] = [];
  socket.on('getMessage', (message: any) => received[name].push(message));
  return socket;
}
const token = (subject: string) =>
  sign({}, authConfig.jwt.secret, { subject, expiresIn: '1h' });
const connected = (socket: any) =>
  new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
const pause = () => new Promise(resolve => setTimeout(resolve, 50));

beforeAll(async () => {
  jest.spyOn(container, 'resolve').mockReturnValue({
    findBySyncId: async (id: string) =>
      ['a', 'b', 'c'].includes(id)
        ? { sync_id: id, status: 'active' }
        : undefined,
  } as any);
  server = new SocketServer();
  http = createServer();
  await server.init(http);
  await new Promise<void>((resolve, reject) => {
    http.once('error', reject);
    http.listen(0, '127.0.0.1', resolve);
  });
  url = `http://127.0.0.1:${(http.address() as any).port}`;
});
afterAll(async () => {
  clients.forEach(client => client.disconnect());
  if (server) await server.close();
  jest.restoreAllMocks();
});

test('real socket handshake rejects unauthenticated/unknown users', async () => {
  await expect(connected(client('missing', { sync_id: 'b' }))).rejects.toThrow(
    'Authentication required',
  );
  await expect(
    connected(client('unknown', { token: token('unknown') })),
  ).rejects.toThrow('Authentication required');
});

test('real rooms support multiple devices, ignore client spoofing, and deliver direct and group events once', async () => {
  const a = client('a', { token: token('a'), sync_id: 'b' });
  const b = client('b', { token: token('b') });
  const b2 = client('b2', { token: token('b') });
  const c = client('c', { token: token('c') });
  await Promise.all([a, b, b2, c].map(connected));
  a.emit('addUser', 'b');
  a.emit('sendMessage', {
    sender: 'b',
    receiver_id: 'c',
    text: 'forged',
    conversation_id: 'group',
  });
  await pause();
  expect(received.c).toHaveLength(0);
  const direct = {
    id: 'direct-message',
    sender: 'a',
    text: 'direct',
    conversation_syncid: 'direct',
    created_at: 'now',
  };
  server.messageCreated(direct, ['a', 'b']);
  await pause();
  expect(received.a).toHaveLength(0);
  expect(received.c).toHaveLength(0);
  expect(received.b).toEqual([{ ...direct, conversation_id: 'direct' }]);
  expect(received.b2).toEqual(received.b);
  const group = {
    ...direct,
    id: 'group-message',
    conversation_syncid: 'group',
    text: 'group',
  };
  server.messageCreated(group, ['a', 'b', 'c']);
  await pause();
  expect(received.a).toHaveLength(0);
  expect(received.b).toHaveLength(2);
  expect(received.b2).toHaveLength(2);
  expect(received.c).toEqual([{ ...group, conversation_id: 'group' }]);
});
