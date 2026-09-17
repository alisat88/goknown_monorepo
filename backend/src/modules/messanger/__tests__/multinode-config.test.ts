import 'reflect-metadata';
import { messengerSocketConfig } from '@config/messengerSocket';
import { SocketServer } from '@shared/infra/http/socketIO';
import { readFileSync } from 'fs';
import { resolve } from 'path';

test('production refuses an unverified node-local cache as a shared adapter', () => {
  expect(() =>
    messengerSocketConfig({ NODE_ENV: 'production', REDIS_HOST: 'redis' }),
  ).toThrow('Production requires');
  expect(messengerSocketConfig({ NODE_ENV: 'test' }).redisUrl).toBeUndefined();
});
test('dedicated TLS URL or explicit verified shared cache settings configure Redis', () => {
  expect(
    messengerSocketConfig({
      NODE_ENV: 'production',
      MESSENGER_REDIS_URL: 'rediss://shared.example:25061',
    }),
  ).toMatchObject({ redisUrl: 'rediss://shared.example:25061' });
  expect(
    messengerSocketConfig({
      NODE_ENV: 'production',
      MESSENGER_REDIS_SHARED: 'true',
      REDIS_HOST: 'shared.example',
      REDIS_PORT: '25061',
      REDIS_TLS: 'true',
    }),
  ).toMatchObject({
    redisOptions: { host: 'shared.example', port: 25061, tls: {} },
  });
  expect(() =>
    messengerSocketConfig({ MESSENGER_REDIS_URL: 'https://wrong.example' }),
  ).toThrow();
});
test('Redis outage rejects writes with 503 rather than pretending local broadcast is cluster delivery', () => {
  const server = new SocketServer();
  (server as any).redisClients = [{ status: 'reconnecting' }];
  expect(() => server.ensureAvailable()).toThrow();
  try {
    server.ensureAvailable();
  } catch (error: any) {
    expect(error.statusCode).toBe(503);
  }
});
test('Messenger controllers no longer import peer forwarding or expose sync middleware', () => {
  for (const file of [
    'infra/http/controllers/MessageController.ts',
    'infra/http/controllers/ConversationController.ts',
    'infra/http/routes/conversations.routes.ts',
  ]) {
    const source = readFileSync(resolve(__dirname, '..', file), 'utf8');
    expect(source).not.toMatch(/@config\/nodes|@config\/api|syncNodeMessanger/);
  }
  const bootstrap = readFileSync(
    resolve(__dirname, '../../../shared/infra/http/server.ts'),
    'utf8',
  );
  expect(bootstrap).not.toContain("process.env.NODE_NAME === 'NODE1'");
  expect(bootstrap).toContain('SocketServer.init(server)');
});
