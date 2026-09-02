import 'reflect-metadata';

import AppError from '@shared/errors/AppError';
import CreateGroupService from '../services/CreateGroupService';

describe('CreateGroupService idempotency', () => {
  const owner = {
    id: 'owner-id',
    sync_id: 'owner-sync-id',
  };

  const request = {
    name: 'Shared group',
    user_syncid: owner.sync_id,
    shared_users_ids: ['participant-sync-id'],
    sync_id: 'group-sync-id',
    description: 'Test group',
  };

  function buildService(existingGroup?: any) {
    const groupsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(existingGroup),
      create: jest.fn(),
    };

    const usersRepository = {
      findBySyncId: jest.fn().mockResolvedValue(owner),
      findAll: jest.fn(),
    };

    return {
      service: new CreateGroupService(
        groupsRepository as any,
        usersRepository as any,
      ),
      groupsRepository,
      usersRepository,
    };
  }

  test('returns the existing group for a repeated sync request', async () => {
    const existingGroup = {
      id: 'existing-group-id',
      owner_id: owner.id,
      sync_id: request.sync_id,
    };

    const {
      service,
      groupsRepository,
      usersRepository,
    } = buildService(existingGroup);

    await expect(service.execute(request)).resolves.toBe(existingGroup);
    expect(groupsRepository.create).not.toHaveBeenCalled();
    expect(usersRepository.findAll).not.toHaveBeenCalled();
  });

  test('creates one group when the sync id does not exist', async () => {
    const {
      service,
      groupsRepository,
      usersRepository,
    } = buildService();

    const sharedUsers = [owner, { id: 'participant-id' }];
    const createdGroup = {
      id: 'created-group-id',
      owner_id: owner.id,
      sync_id: request.sync_id,
    };

    usersRepository.findAll.mockResolvedValue(sharedUsers);
    groupsRepository.create.mockResolvedValue(createdGroup);

    await expect(service.execute(request)).resolves.toBe(createdGroup);

    expect(groupsRepository.create).toHaveBeenCalledTimes(1);
    expect(groupsRepository.create).toHaveBeenCalledWith({
      name: request.name,
      owner_id: owner.id,
      shared_users: sharedUsers,
      sync_id: request.sync_id,
      description: request.description,
    });
  });

  test('rejects a sync id belonging to a different owner', async () => {
    const {
      service,
      groupsRepository,
    } = buildService({
      id: 'conflicting-group-id',
      owner_id: 'different-owner-id',
      sync_id: request.sync_id,
    });

    await expect(service.execute(request)).rejects.toBeInstanceOf(AppError);
    expect(groupsRepository.create).not.toHaveBeenCalled();
  });
});
