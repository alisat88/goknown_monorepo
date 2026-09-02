import 'reflect-metadata';

import AppError from '@shared/errors/AppError';
import CreateDataFormRecordsService from '../services/CreateDataFormRecordsService';
import CreateDataFormsService from '../services/CreateDataFormsService';
import CreateDataFormStructuresService from '../services/CreateDataFormStructuresService';

describe('Data Forms create idempotency', () => {
  const user = {
    id: 'owner-database-id',
    sync_id: 'owner-sync-id',
  };

  const dataForm = {
    id: 'form-database-id',
    owner_id: user.id,
    sync_id: 'form-sync-id',
    owner: {
      sync_id: user.sync_id,
    },
  };

  test('returns an existing form owned by the requesting user', async () => {
    const dataFormsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(dataForm),
      create: jest.fn(),
    };
    const usersRepository = {
      findBySyncId: jest.fn().mockResolvedValue(user),
    };
    const groupsRepository = {
      findAll: jest.fn(),
    };
    const roomsRepository = {
      findBySyncId: jest.fn(),
    };

    const service = new CreateDataFormsService(
      dataFormsRepository as any,
      usersRepository as any,
      groupsRepository as any,
      roomsRepository as any,
    );

    await expect(
      service.execute({
        name: 'Test form',
        user_syncid: user.sync_id,
        sync_id: dataForm.sync_id,
      }),
    ).resolves.toBe(dataForm);

    expect(dataFormsRepository.create).not.toHaveBeenCalled();
    expect(groupsRepository.findAll).not.toHaveBeenCalled();
    expect(roomsRepository.findBySyncId).not.toHaveBeenCalled();
  });

  test('rejects an existing form sync id owned by another user', async () => {
    const dataFormsRepository = {
      findBySyncId: jest.fn().mockResolvedValue({
        ...dataForm,
        owner_id: 'different-owner-id',
      }),
      create: jest.fn(),
    };
    const usersRepository = {
      findBySyncId: jest.fn().mockResolvedValue(user),
    };

    const service = new CreateDataFormsService(
      dataFormsRepository as any,
      usersRepository as any,
      { findAll: jest.fn() } as any,
      { findBySyncId: jest.fn() } as any,
    );

    await expect(
      service.execute({
        name: 'Test form',
        user_syncid: user.sync_id,
        sync_id: dataForm.sync_id,
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(dataFormsRepository.create).not.toHaveBeenCalled();
  });

  test('returns an existing structure for the same form and owner', async () => {
    const existingStructure = {
      id: 'structure-database-id',
      sync_id: 'structure-sync-id',
      form_id: dataForm.id,
      owner_id: user.id,
    };
    const structuresRepository = {
      findBySyncId: jest.fn().mockResolvedValue(existingStructure),
      findByDataFormId: jest.fn(),
      create: jest.fn(),
    };

    const service = new CreateDataFormStructuresService(
      structuresRepository as any,
      { findBySyncId: jest.fn().mockResolvedValue(dataForm) } as any,
      { findBySyncId: jest.fn().mockResolvedValue(user) } as any,
    );

    await expect(
      service.execute({
        user_syncid: user.sync_id,
        sync_id: existingStructure.sync_id,
        form_syncid: dataForm.sync_id,
        value_json: '{"field":"value"}',
      }),
    ).resolves.toBe(existingStructure);

    expect(structuresRepository.findByDataFormId).not.toHaveBeenCalled();
    expect(structuresRepository.create).not.toHaveBeenCalled();
  });

  test('rejects a structure sync id belonging to another form', async () => {
    const structuresRepository = {
      findBySyncId: jest.fn().mockResolvedValue({
        id: 'structure-database-id',
        sync_id: 'structure-sync-id',
        form_id: 'different-form-id',
        owner_id: user.id,
      }),
      findByDataFormId: jest.fn(),
      create: jest.fn(),
    };

    const service = new CreateDataFormStructuresService(
      structuresRepository as any,
      { findBySyncId: jest.fn().mockResolvedValue(dataForm) } as any,
      { findBySyncId: jest.fn().mockResolvedValue(user) } as any,
    );

    await expect(
      service.execute({
        user_syncid: user.sync_id,
        sync_id: 'structure-sync-id',
        form_syncid: dataForm.sync_id,
        value_json: '{"field":"value"}',
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(structuresRepository.create).not.toHaveBeenCalled();
  });

  test('returns an existing record for the same form', async () => {
    const existingRecord = {
      id: 'record-database-id',
      sync_id: 'record-sync-id',
      form_id: dataForm.id,
    };
    const recordsRepository = {
      findBySyncId: jest.fn().mockResolvedValue(existingRecord),
      create: jest.fn(),
    };

    const service = new CreateDataFormRecordsService(
      {} as any,
      recordsRepository as any,
      { findBySyncId: jest.fn().mockResolvedValue(dataForm) } as any,
      { findBySyncId: jest.fn().mockResolvedValue(user) } as any,
    );

    await expect(
      service.execute({
        user_syncid: user.sync_id,
        sync_id: existingRecord.sync_id,
        form_syncid: dataForm.sync_id,
        value_json: '{"answer":"yes"}',
      }),
    ).resolves.toBe(existingRecord);

    expect(recordsRepository.create).not.toHaveBeenCalled();
  });

  test('rejects a record sync id belonging to another form', async () => {
    const recordsRepository = {
      findBySyncId: jest.fn().mockResolvedValue({
        id: 'record-database-id',
        sync_id: 'record-sync-id',
        form_id: 'different-form-id',
      }),
      create: jest.fn(),
    };

    const service = new CreateDataFormRecordsService(
      {} as any,
      recordsRepository as any,
      { findBySyncId: jest.fn().mockResolvedValue(dataForm) } as any,
      { findBySyncId: jest.fn().mockResolvedValue(user) } as any,
    );

    await expect(
      service.execute({
        user_syncid: user.sync_id,
        sync_id: 'record-sync-id',
        form_syncid: dataForm.sync_id,
        value_json: '{"answer":"yes"}',
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(recordsRepository.create).not.toHaveBeenCalled();
  });
});
