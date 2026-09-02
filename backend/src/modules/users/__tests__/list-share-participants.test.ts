import 'reflect-metadata';

import { EnumStatus } from '../infra/typeorm/entities/User';
import ListShareParticipantsService from '../services/ListShareParticipantsService';

describe('ListShareParticipantsService', () => {
  test('returns only safe fields for active matching users', async () => {
    const findAll = jest.fn().mockResolvedValue([
      {
        id: 'user-id',
        sync_id: 'user-sync-id',
        name: 'Alisa Sharing Test',
        email: 'private@example.com',
        phone: '5555555555',
        role: 'buyer',
        status: EnumStatus.Active,
        getAvatarUrl: () => 'https://example.com/avatar.png',
      },
    ]);

    const service = new ListShareParticipantsService({
      findAll,
    } as any);

    const result = await service.execute({
      name: '  Alisa  ',
    });

    expect(findAll).toHaveBeenCalledWith({
      status: [EnumStatus.Active],
      name: 'Alisa',
      limit: 30,
      offset: 0,
    });

    expect(result).toEqual([
      {
        id: 'user-id',
        sync_id: 'user-sync-id',
        name: 'Alisa Sharing Test',
        avatar_url: 'https://example.com/avatar.png',
      },
    ]);

    expect(result[0]).not.toHaveProperty('email');
    expect(result[0]).not.toHaveProperty('phone');
    expect(result[0]).not.toHaveProperty('role');
    expect(result[0]).not.toHaveProperty('status');
  });

  test('does not query the repository for fewer than three characters', async () => {
    const findAll = jest.fn();
    const service = new ListShareParticipantsService({
      findAll,
    } as any);

    await expect(service.execute({ name: 'Al' })).resolves.toEqual([]);
    expect(findAll).not.toHaveBeenCalled();
  });
});
