import 'reflect-metadata';

import AppError from '@shared/errors/AppError';
import { EnumStatus as EnumGroupStatus } from '../infra/typeorm/entities/Group';
import { EnumRole } from '../infra/typeorm/entities/OrganizationUser';
import CreateGroupService from '../services/CreateGroupService';
import CreateRoomService from '../services/CreateRoomService';

describe('Organization group create idempotency', () => {
  const requester = {
    id: 'requester-database-id',
    sync_id: 'requester-sync-id',
  };

  const admin = {
    id: 'admin-database-id',
    sync_id: 'admin-sync-id',
  };

  const organization = {
    id: 'organization-database-id',
    sync_id: 'organization-sync-id',
    admin_alias: 'Admins',
  };

  const request = {
    admin_id: admin.sync_id,
    name: 'Engineering',
    organization_id: organization.sync_id,
    sync_id: 'organization-group-sync-id',
    user_syncid: requester.sync_id,
  };

  function buildGroupService(existingGroup?: any) {
    const organizationsGroupsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(existingGroup),
      create: jest.fn(),
    };

    const organizationsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(organization),
    };

    const organizationsUsersRepository = {
      findAllUsersByOrganization: jest.fn().mockResolvedValue([
        {
          role: EnumRole.Owner,
          user_id: requester.id,
        },
      ]),
    };

    const usersRepository = {
      findBySyncId: jest.fn().mockImplementation(async (syncId: string) => {
        if (syncId === requester.sync_id) {
          return requester;
        }

        if (syncId === admin.sync_id) {
          return admin;
        }

        return undefined;
      }),
    };

    return {
      service: new CreateGroupService(
        organizationsGroupsRepository as any,
        organizationsRepository as any,
        organizationsUsersRepository as any,
        usersRepository as any,
      ),
      organizationsGroupsRepository,
    };
  }

  test('returns an existing group for the same organization', async () => {
    const existingGroup = {
      id: 'existing-group-id',
      sync_id: request.sync_id,
      organization_id: organization.id,
      admin_id: admin.id,
    };

    const { service, organizationsGroupsRepository } =
      buildGroupService(existingGroup);

    await expect(service.execute(request)).resolves.toBe(existingGroup);
    expect(organizationsGroupsRepository.create).not.toHaveBeenCalled();
  });

  test('creates one group when the sync id does not exist', async () => {
    const createdGroup = {
      id: 'created-group-id',
      sync_id: request.sync_id,
      organization_id: organization.id,
      admin_id: admin.id,
    };

    const { service, organizationsGroupsRepository } = buildGroupService();

    organizationsGroupsRepository.create.mockResolvedValue(createdGroup);

    await expect(service.execute(request)).resolves.toBe(createdGroup);
    expect(organizationsGroupsRepository.create).toHaveBeenCalledTimes(1);
  });

  test('rejects a group sync id belonging to another organization', async () => {
    const { service, organizationsGroupsRepository } = buildGroupService({
      id: 'conflicting-group-id',
      sync_id: request.sync_id,
      organization_id: 'different-organization-id',
      admin_id: admin.id,
    });

    await expect(service.execute(request)).rejects.toBeInstanceOf(AppError);
    expect(organizationsGroupsRepository.create).not.toHaveBeenCalled();
  });
});

describe('Organization room create idempotency', () => {
  const requester = {
    id: 'requester-database-id',
    sync_id: 'requester-sync-id',
  };

  const group = {
    id: 'group-database-id',
    sync_id: 'group-sync-id',
    admin_id: 'admin-database-id',
    status: EnumGroupStatus.Active,
    admin: {
      name: 'Group Admin',
    },
    organization_id: 'organization-database-id',
    organization: {
      sync_id: 'organization-sync-id',
    },
  };

  const request = {
    user_syncid: requester.sync_id,
    organization_syncid: group.organization.sync_id,
    group_syncid: group.sync_id,
    name: 'Planning Room',
    dls_syncids: ['dls-sync-id'],
    sync_id: 'organization-room-sync-id',
  };

  function buildRoomService(existingRoom?: any) {
    const organizationsRoomsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(existingRoom),
      create: jest.fn(),
    };

    const organizationsGroupsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(group),
    };

    const organizationsUsersRepository = {
      findAllUsersByOrganization: jest.fn().mockResolvedValue([
        {
          role: EnumRole.Owner,
          user_id: requester.id,
        },
      ]),
    };

    const usersRepository = {
      findBySyncId: jest.fn().mockResolvedValue(requester),
    };

    const dlsRepository = {
      findAllBySyncId: jest.fn().mockResolvedValue([
        {
          id: 'dls-database-id',
          sync_id: 'dls-sync-id',
        },
      ]),
    };

    return {
      service: new CreateRoomService(
        organizationsRoomsRepository as any,
        organizationsGroupsRepository as any,
        organizationsUsersRepository as any,
        usersRepository as any,
        dlsRepository as any,
      ),
      organizationsRoomsRepository,
      dlsRepository,
    };
  }

  test('returns an existing room for the same group', async () => {
    const existingRoom = {
      id: 'existing-room-id',
      sync_id: request.sync_id,
      group_id: group.id,
      admin_id: group.admin_id,
    };

    const {
      service,
      organizationsRoomsRepository,
      dlsRepository,
    } = buildRoomService(existingRoom);

    await expect(service.execute(request)).resolves.toBe(existingRoom);
    expect(organizationsRoomsRepository.create).not.toHaveBeenCalled();
    expect(dlsRepository.findAllBySyncId).not.toHaveBeenCalled();
  });

  test('creates one room when the sync id does not exist', async () => {
    const createdRoom = {
      id: 'created-room-id',
      sync_id: request.sync_id,
      group_id: group.id,
      admin_id: group.admin_id,
    };

    const { service, organizationsRoomsRepository } = buildRoomService();

    organizationsRoomsRepository.create.mockResolvedValue(createdRoom);

    await expect(service.execute(request)).resolves.toBe(createdRoom);
    expect(organizationsRoomsRepository.create).toHaveBeenCalledTimes(1);
  });

  test('rejects a room sync id belonging to another group', async () => {
    const { service, organizationsRoomsRepository } = buildRoomService({
      id: 'conflicting-room-id',
      sync_id: request.sync_id,
      group_id: 'different-group-id',
      admin_id: group.admin_id,
    });

    await expect(service.execute(request)).rejects.toBeInstanceOf(AppError);
    expect(organizationsRoomsRepository.create).not.toHaveBeenCalled();
  });
});
