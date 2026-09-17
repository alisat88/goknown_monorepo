import 'reflect-metadata';
import { Server } from 'socket.io';
import { container } from 'tsyringe';
import SocketSingleton, {
  SocketServer,
  authenticateSocket,
  userRoom,
} from '@shared/infra/http/socketIO';
import MessageController from '../infra/http/controllers/MessageController';
import CreateNewMessageService from '../services/CreateNewMessageService';
jest.mock('socket.io', () => ({ Server: jest.fn() }));
jest.mock('@config/nodes', () => ({ __esModule: true, default: [] }));

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('connections require auth, join the verified room on every device, and have no sendMessage relay', async () => {
  jest.useFakeTimers();
  const io: any = {
    use: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    sockets: { sockets: new Map() },
    fetchSockets: jest.fn(async () => Array.from(io.sockets.sockets.values())),
  };
  (Server as unknown as jest.Mock).mockImplementation(() => io);
  await new SocketServer().init({} as any);
  expect(io.use).toHaveBeenCalledWith(authenticateSocket);
  const connect = io.on.mock.calls.find(
    (call: any[]) => call[0] === 'connection',
  )[1];
  const sockets = ['tab1', 'tab2'].map(id => ({
    id,
    data: { usersync_id: 'verified', expiresAt: Date.now() + 10000 },
    join: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
  }));
  for (const socket of sockets) {
    io.sockets.sockets.set(socket.id, socket);
    connect(socket);
    expect(socket.join).toHaveBeenCalledWith(userRoom('verified'));
    const addUser = socket.on.mock.calls.find(call => call[0] === 'addUser')[1];
    addUser('victim');
    expect(socket.data.usersync_id).toBe('verified');
    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.on.mock.calls.some(call => call[0] === 'sendMessage')).toBe(
      false,
    );
  }
  jest.advanceTimersByTime(10001);
  sockets.forEach(socket =>
    expect(socket.disconnect).toHaveBeenCalledWith(true),
  );
});

test('HTTP sender comes from JWT identity and emission happens only after successful persistence', async () => {
  const persisted = {
    id: 'saved',
    sender: 'verified',
    conversation_syncid: 'chat',
    text: 'persisted text',
    created_at: 'now',
  };
  let finish: (value: any) => void = () => {};
  const execute = jest.fn(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  jest.spyOn(container, 'resolve').mockImplementation((key: any) =>
    key === CreateNewMessageService
      ? ({ execute } as any)
      : ({
          findBySyncId: async () => ({ members: ['verified', 'recipient'] }),
        } as any),
  );
  const emit = jest
    .spyOn(SocketSingleton, 'messageCreated')
    .mockImplementation(() => {});
  const response: any = { json: jest.fn() };
  const request: any = {
    user: { sync_id: 'verified' },
    params: { id: 'chat' },
    body: { sender: 'victim', text: 'persisted text' },
  };
  const pending = new MessageController().create(request, response);
  expect(execute).toHaveBeenCalledWith({
    sender: 'verified',
    conversation_syncid: 'chat',
    text: 'persisted text',
  });
  expect(emit).not.toHaveBeenCalled();
  finish(persisted);
  await pending;
  expect(emit).toHaveBeenCalledTimes(1);
  expect(emit).toHaveBeenCalledWith(persisted, ['verified', 'recipient']);
  emit.mockClear();
  execute.mockRejectedValueOnce(new Error('database failure') as never);
  await expect(
    new MessageController().create(request, response),
  ).rejects.toThrow('database failure');
  expect(emit).not.toHaveBeenCalled();
});
