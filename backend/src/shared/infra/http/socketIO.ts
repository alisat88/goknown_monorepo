import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Redis, { Redis as RedisClient } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import {
  messengerSocketConfig,
  IMessengerSocketConfig,
} from '@config/messengerSocket';
import AppError from '@shared/errors/AppError';
import { verify } from 'jsonwebtoken';
import { container } from 'tsyringe';
import authConfig from '@config/auth';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { EnumStatus } from '@modules/users/infra/typeorm/entities/User';
import Message from '@modules/messanger/infra/typeorm/entities/Message';

export const userRoom = (syncId: string): string => `messenger:user:${syncId}`;

export async function authenticateSocket(
  socket: Socket,
  next: (error?: Error) => void,
): Promise<void> {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') throw new Error();
    const payload = verify(token, authConfig.jwt.secret);
    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      !payload.exp
    )
      throw new Error();
    const users = container.resolve<IUsersRepository>('UsersRepository');
    const user = await users.findBySyncId(payload.sub);
    if (!user || user.status !== EnumStatus.Active) throw new Error();
    // fetchSockets serializes handshake data across the trusted adapter. Do not
    // include the login token in presence queries.
    socket.handshake.auth = {};
    socket.data.usersync_id = user.sync_id;
    socket.data.expiresAt = payload.exp * 1000;
    next();
  } catch {
    next(new Error('Authentication required'));
  }
}

export class SocketServer {
  private io?: Server;
  private redisClients?: RedisClient[];
  private adapterFailed = false;
  private presenceTimer?: NodeJS.Timeout;
  private presenceInterval?: NodeJS.Timeout;

  public async init(
    server: HttpServer,
    config: IMessengerSocketConfig = messengerSocketConfig(),
  ): Promise<void> {
    if (this.io) return;
    this.io = new Server(server, { path: '/socket.io', cors: { origin: '*' } });
    try {
      if (config.redisUrl || config.redisOptions) {
        const options = {
          ...config.redisOptions,
          lazyConnect: true,
          connectTimeout: 10000,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        };
        const publisher = config.redisUrl
          ? new Redis(config.redisUrl, options)
          : new Redis(options);
        const subscriber = publisher.duplicate();
        this.redisClients = [publisher, subscriber];
        for (const client of this.redisClients) {
          client.on('error', () =>
            console.error(
              'Messenger Redis connection error; cross-node delivery is unavailable.',
            ),
          );
          client.on('close', () =>
            console.error(
              'Messenger Redis connection closed; new Messenger writes are unavailable until reconnection.',
            ),
          );
        }
        let timeout: NodeJS.Timeout | undefined;
        try {
          await Promise.race([
            Promise.all(this.redisClients.map(client => client.connect())),
            new Promise((_, reject) => {
              timeout = setTimeout(
                () => reject(new Error('Messenger Redis startup timeout')),
                10000,
              );
            }),
          ]);
        } finally {
          if (timeout) clearTimeout(timeout);
        }
        this.io.adapter(
          createAdapter(publisher, subscriber, {
            key: config.channelPrefix,
            publishOnSpecificResponseChannel: true,
          }),
        );
        this.io.of('/').adapter.on('error', () => {
          this.adapterFailed = true;
          console.error(
            'Messenger Redis adapter command failed; Messenger writes require an operator restart after repair.',
          );
        });
        // Wait for the subscription commands queued by the adapter, and verify publish permission.
        await subscriber.ping();
        await publisher.publish(`${config.channelPrefix}:health`, 'ready');
        this.ensureAvailable();
      } else {
        console.info(
          'Messenger uses a single-process adapter for development/test only.',
        );
      }
      this.io.use(authenticateSocket);
      this.io.on('connection', socket => {
        socket.join(userRoom(socket.data.usersync_id));
        this.schedulePresence();
        // Request a cluster-wide presence refresh, never a client-chosen identity.
        socket.on('addUser', () => this.schedulePresence());
        const expiry = setTimeout(
          () => socket.disconnect(true),
          Math.min(Math.max(0, socket.data.expiresAt - Date.now()), 2147483647),
        );
        socket.on('disconnect', () => {
          clearTimeout(expiry);
          this.schedulePresence();
        });
      });
      // Reconcile abrupt process failures as well as graceful disconnects.
      this.presenceInterval = setInterval(() => this.schedulePresence(), 30000);
      this.presenceInterval.unref();
    } catch {
      await this.close();
      throw new Error('Messenger shared Redis adapter failed to initialize');
    }
  }

  public ensureAvailable(): void {
    if (
      this.adapterFailed ||
      this.redisClients?.some(client => client.status !== 'ready')
    ) {
      throw new AppError(
        'Messenger realtime service is temporarily unavailable',
        503,
      );
    }
  }

  private canEmit(): boolean {
    try {
      this.ensureAvailable();
      return true;
    } catch {
      // A commit may race with an outage: preserve the saved response, do not
      // pretend a local-only broadcast succeeded. History remains recoverable.
      console.error(
        'Messenger event not broadcast: shared adapter unavailable. Reload committed history after recovery.',
      );
      return false;
    }
  }

  private schedulePresence(): void {
    if (this.presenceTimer) return;
    this.presenceTimer = setTimeout(() => {
      this.presenceTimer = undefined;
      void this.publishPresence();
    }, 50);
    this.presenceTimer.unref();
  }

  private async publishPresence(): Promise<void> {
    if (!this.io || !this.canEmit()) return;
    try {
      const sockets = await this.io.fetchSockets();
      this.io.emit(
        'getUsers',
        sockets.map(socket => ({
          usersync_id: socket.data.usersync_id,
          socket_id: socket.id,
        })),
      );
    } catch {
      // Never substitute one node's list for cluster-wide presence.
      console.error('Messenger cluster presence refresh failed.');
    }
  }

  public messageCreated(message: Message, members: string[]): void {
    if (!this.canEmit()) return;
    for (const member of new Set(members)) {
      if (member === message.sender) continue;
      this.io?.to(userRoom(member)).emit('getMessage', {
        ...message,
        conversation_id: message.conversation_syncid,
      });
      this.io?.to(userRoom(member)).emit('newMessage', {
        conversation_id: message.conversation_syncid,
        receiver_id: member,
      });
    }
    this.conversationsChanged(members);
  }

  public conversationsChanged(members: string[]): void {
    if (!this.canEmit()) return;
    for (const member of new Set(members))
      this.io?.to(userRoom(member)).emit('conversationsChanged');
  }

  public async close(): Promise<void> {
    if (this.presenceInterval) clearInterval(this.presenceInterval);
    if (this.presenceTimer) clearTimeout(this.presenceTimer);
    const io = this.io;
    this.io = undefined;
    if (io) await new Promise<void>(resolve => io.close(() => resolve()));
    if (this.presenceTimer) clearTimeout(this.presenceTimer);
    this.presenceTimer = undefined;
    this.redisClients?.forEach(client => {
      client.removeAllListeners();
      client.disconnect();
    });
    this.redisClients = undefined;
  }
}
export default new SocketServer();
