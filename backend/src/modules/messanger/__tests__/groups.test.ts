import 'reflect-metadata';
import CreateGroupConversationService from '../services/CreateGroupConversationService';
import ListAllUserConversationsService from '../services/ListAllUserConversationsService';
import FindConversationsService from '../services/FindConversationsService';
import GetUnreadService from '../services/GetUnreadService';
import canonicalizeAccountEmail from '@shared/utils/canonicalizeAccountEmail';

function setup() {
  const owner = {
    sync_id: 'owner',
    email: 'owner@example.com',
    status: 'active',
    name: 'Owner',
  };
  const alice = {
    sync_id: 'alice',
    email: 'alice@example.com',
    status: 'active',
    name: 'Alice',
  };
  const bob = {
    sync_id: 'bob',
    email: 'bob@example.com',
    status: 'active',
    name: 'Bob',
  };
  const inactive = {
    sync_id: 'inactive',
    email: 'inactive@example.com',
    status: 'inactive',
  };
  const users: any = {
    findBySyncId: jest.fn(async (id: string) =>
      [owner, alice, bob].find(u => u.sync_id === id),
    ),
    findByEmail: jest.fn(async (email: string) =>
      [owner, alice, bob, inactive].find(u => u.email === email),
    ),
    findAll: jest.fn(async () => [owner, alice, bob]),
  };
  const repository: any = {
    create: jest.fn(async (data: any) => ({ ...data, id: 'id' })),
    findAll: jest.fn(),
  };
  return {
    users,
    repository,
    service: new CreateGroupConversationService(repository, users),
  };
}

test('valid active users create one group with automatic creator and canonical emails', async () => {
  const { service, repository, users } = setup();
  const group = await service.execute({
    creator: 'owner',
    name: ' Engineering ',
    emails: [' Alice+work@Example.com ', 'bob@example.com'],
  });
  expect(group).toMatchObject({
    name: 'Engineering',
    members: ['owner', 'alice', 'bob'],
    type: 'group',
    created_by: 'owner',
  });
  expect(repository.create).toHaveBeenCalledTimes(1);
  expect(users.findByEmail).toHaveBeenCalledWith('alice@example.com');
  expect(canonicalizeAccountEmail(' Alice+tag@Example.com ')).toBe(
    'alice@example.com',
  );
});

test.each([
  ['malformed', ['not-an-email', 'bob@example.com']],
  ['nonexistent', ['missing@example.com', 'bob@example.com']],
  ['inactive', ['inactive@example.com', 'bob@example.com']],
  ['duplicate', ['alice@example.com', 'alice@example.com']],
  ['canonical duplicate', ['ALICE+work@example.com', 'alice@example.com']],
  ['self invite', ['owner+alias@example.com', 'bob@example.com']],
  ['too few', ['bob@example.com']],
])('rejects %s without partial creation', async (_label, emails) => {
  const { service, repository } = setup();
  await expect(
    service.execute({ creator: 'owner', name: 'Engineering', emails }),
  ).rejects.toBeDefined();
  expect(repository.create).not.toHaveBeenCalled();
});

test('blank name is rejected before creating', async () => {
  const { service, repository } = setup();
  await expect(
    service.execute({
      creator: 'owner',
      name: '  ',
      emails: ['alice@example.com', 'bob@example.com'],
    }),
  ).rejects.toBeDefined();
  expect(repository.create).not.toHaveBeenCalled();
});

test('group and legacy direct list entries remain separate, use current member unread and omit message history', async () => {
  const { users, repository } = setup();
  const group = {
    id: 'group',
    sync_id: 'group',
    type: 'group',
    name: 'Team',
    members: ['owner', 'alice', 'bob'],
    unread: [2, 3, 4],
    messages: [{ text: 'private history' }],
  };
  const direct = {
    id: 'direct',
    sync_id: 'direct',
    members: ['owner', 'alice'],
    unread: [1, 5],
    messages: [],
  };
  repository.findAll.mockResolvedValue([group, direct]);
  const list = await new ListAllUserConversationsService(
    repository,
    users,
    {} as any,
  ).execute({ usersync_id: 'owner' });
  expect(list.find(item => item.sync_id === 'alice')).toMatchObject({
    news: 1,
    conversation: { sync_id: 'direct', type: 'direct' },
  });
  expect(list.find(item => item.sync_id === 'group')).toMatchObject({
    name: 'Team',
    news: 2,
    conversation: {
      participants: [
        { sync_id: 'owner', name: 'Owner' },
        { sync_id: 'alice', name: 'Alice' },
        { sync_id: 'bob', name: 'Bob' },
      ],
    },
  });
  list.forEach(item => expect(item.conversation?.messages).toBeUndefined());
  await expect(
    new FindConversationsService(repository, users).execute({
      usersync_id: 'owner',
      receiver_id: 'alice',
    }),
  ).resolves.toBe(direct);
  await expect(
    new GetUnreadService(repository).execute('owner'),
  ).resolves.toEqual({ unread: 3, conversations: { group: 2, direct: 1 } });
  expect(repository.findAll).toHaveBeenCalledWith(['owner']);
});
