// Disposable integration-test worker. Never imports the production bootstrap or .env.
import 'reflect-metadata';
import express from 'express';
import 'express-async-errors';
import { errors } from 'celebrate';
import { createServer } from 'http';
import { createConnection } from 'typeorm';
import { container } from 'tsyringe';
import SocketServer from '@shared/infra/http/socketIO';
import Conversation from '../infra/typeorm/entities/Conversation';
import ConversationsRepository from '../infra/typeorm/repositories/ConversationsRepository';
import MessagesRepository from '../infra/typeorm/repositories/MessagesRepository';
import router from '../infra/http/routes/conversations.routes';

async function start(): Promise<void> {
  const url = new URL(process.env.MESSENGER_TEST_DATABASE_URL || '');
  if (
    url.hostname !== '127.0.0.1' ||
    url.pathname !== '/messenger_multinode_test'
  )
    throw new Error('Local disposable test database required');
  const connection = await createConnection({
    type: 'postgres',
    url: url.toString(),
    entities: [Conversation],
    synchronize: false,
    migrationsRun: false,
    installExtensions: false,
  });
  const users = JSON.parse(process.env.MESSENGER_TEST_USERS || '[]');
  container.registerInstance('UsersRepository', {
    findBySyncId: async (id: string) =>
      users.find((user: any) => user.sync_id === id),
    findByEmail: async (email: string) =>
      users.find((user: any) => user.email === email),
    findAll: async () => users,
  });
  container.registerInstance(
    'ConversationsRepository',
    new ConversationsRepository(),
  );
  container.registerInstance('MessagesRepository', new MessagesRepository());
  container.registerInstance('OrganizationsRoomsRepository', {});
  const app = express();
  app.use(express.json());
  app.use('/conversations', router);
  app.use(errors());
  app.use((error: any, _request: any, response: any, _next: any) =>
    response.status(error.statusCode || 500).json({ message: error.message }),
  );
  const server = createServer(app);
  await SocketServer.init(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  process.send?.({ ready: true, port: (server.address() as any).port });
  process.on('message', async message => {
    if (message === 'shutdown') {
      await SocketServer.close();
      await connection.close();
      process.exit(0);
    }
  });
}
start().catch(() => {
  process.send?.({ error: 'Test worker startup failed' });
  process.exit(1);
});
