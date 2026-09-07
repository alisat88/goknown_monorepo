import 'reflect-metadata';

import AppError from '@shared/errors/AppError';
import CreateOrganizationService from '../services/CreateOrganizationService';

describe('CreateOrganizationService idempotency', () => {
  const owner = {
    id: 'owner-id',
    sync_id: 'owner-sync-id',
  };

  const request = {
    name: 'Shared organization',
    user_syncid: owner.sync_id,
    sync_id: 'organization-sync-id',
  };

  function buildService(existingOrganization?: any) {
    const organizationsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(existingOrganization),
      create: jest.fn(),
    };

    const organizationsUsersRepository = {
      createMany: jest.fn(),
    };

    const usersRepository = {
      findBySyncId: jest.fn().mockResolvedValue(owner),
      findAll: jest.fn(),
    };

    return {
      service: new CreateOrganizationService(
        organizationsRepository as any,
        organizationsUsersRepository as any,
        usersRepository as any,
      ),
      organizationsRepository,
      organizationsUsersRepository,
      usersRepository,
    };
  }

  test('returns the existing organization for a repeated sync request', async () => {
    const existingOrganization = {
      id: 'existing-organization-id',
      owner_id: owner.id,
      sync_id: request.sync_id,
    };

    const {
      service,
      organizationsRepository,
      organizationsUsersRepository,
      usersRepository,
    } = buildService(existingOrganization);

    await expect(service.execute(request)).resolves.toBe(existingOrganization);

    expect(organizationsRepository.create).not.toHaveBeenCalled();
    expect(organizationsUsersRepository.createMany).not.toHaveBeenCalled();
    expect(usersRepository.findAll).not.toHaveBeenCalled();
  });

  test('creates one organization when the sync id does not exist', async () => {
    const {
      service,
      organizationsRepository,
      organizationsUsersRepository,
    } = buildService();

    const createdOrganization = {
      id: 'created-organization-id',
      owner_id: owner.id,
      sync_id: request.sync_id,
    };

    organizationsRepository.create.mockResolvedValue(createdOrganization);
    organizationsUsersRepository.createMany.mockResolvedValue([]);

    await expect(service.execute(request)).resolves.toBe(createdOrganization);

    expect(organizationsRepository.create).toHaveBeenCalledTimes(1);
    expect(organizationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: request.name,
        owner_id: owner.id,
        sync_id: request.sync_id,
      }),
    );
    expect(organizationsUsersRepository.createMany).toHaveBeenCalledWith([
      {
        user_id: owner.id,
        organization_id: createdOrganization.id,
        role: 'owner',
        status: 'active',
      },
    ]);
  });

  test('rejects a sync id belonging to a different owner', async () => {
    const {
      service,
      organizationsRepository,
      organizationsUsersRepository,
    } = buildService({
      id: 'conflicting-organization-id',
      owner_id: 'different-owner-id',
      sync_id: request.sync_id,
    });

    await expect(service.execute(request)).rejects.toBeInstanceOf(AppError);

    expect(organizationsRepository.create).not.toHaveBeenCalled();
    expect(organizationsUsersRepository.createMany).not.toHaveBeenCalled();
  });
});
