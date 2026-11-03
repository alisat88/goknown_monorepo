/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import 'reflect-metadata';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { SocketServer } from '@shared/infra/http/socketIO';
jest.mock('ioredis', () => jest.fn());
jest.mock('socket.io', () => ({ Server: jest.fn() }));

test('failed Redis startup closes both clients and the socket server instead of falling back to memory', async () => {
  const publisher: any = new EventEmitter();
  const subscriber: any = new EventEmitter();
  for (const client of [publisher, subscriber]) {
    client.connect = jest.fn().mockRejectedValue(new Error('unreachable'));
    client.disconnect = jest.fn();
  }
  publisher.duplicate = () => subscriber;
  (Redis as unknown as jest.Mock).mockImplementation(() => publisher);
  const io = { close: jest.fn(callback => callback()), adapter: jest.fn() };
  (Server as unknown as jest.Mock).mockImplementation(() => io);
  await expect(
    new SocketServer().init({} as any, {
      redisUrl: 'redis://unreachable.invalid:6379',
      channelPrefix: 'test',
    }),
  ).rejects.toThrow('Messenger shared Redis adapter failed to initialize');
  expect(io.adapter).not.toHaveBeenCalled();
  expect(io.close).toHaveBeenCalled();
  expect(publisher.disconnect).toHaveBeenCalled();
  expect(subscriber.disconnect).toHaveBeenCalled();
});
