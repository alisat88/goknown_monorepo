import 'reflect-metadata';
import CreateRoomService from '../services/CreateRoomService';

const request = {
  user_syncid: 'user-sync',
  organization_syncid: 'org-sync',
  group_syncid: 'group-sync',
  sync_id: 'room-sync',
  name: 'Research',
};

function setup() {
  const rooms = { create: jest.fn().mockImplementation(async data => data) };
  const groups = {
    findBySyncId: jest.fn().mockResolvedValue({
      id: 'group-db',
      admin_id: 'user-db',
      organization_id: 'org-db',
      organization: { sync_id: 'org-sync' },
    }),
  };
  const members = {
    findAllUsersByOrganization: jest.fn().mockResolvedValue([]),
  };
  const users = {
    findBySyncId: jest.fn().mockResolvedValue({ id: 'user-db' }),
  };
  const apps = { findAllBySyncId: jest.fn().mockResolvedValue([]) };
  const service = new CreateRoomService(
    rooms as any,
    groups as any,
    members as any,
    users as any,
    apps as any,
  );
  return { service, rooms, apps, groups };
}

it.each([undefined, []])('creates with optional apps %j', async dls_syncids => {
  const { service, rooms, apps } = setup();
  await service.execute({ ...request, dls_syncids });
  expect(apps.findAllBySyncId).toHaveBeenCalledWith([]);
  expect(rooms.create).toHaveBeenCalledWith({
    sync_id: 'room-sync',
    admin_id: 'user-db',
    group_id: 'group-db',
    name: 'Research',
    dls: [],
  });
});

it('assigns selected apps', async () => {
  const { service, rooms, apps } = setup();
  const selected = [{ id: 'app-db', sync_id: 'app-sync' }];
  apps.findAllBySyncId.mockResolvedValue(selected);
  await service.execute({ ...request, dls_syncids: ['app-sync'] });
  expect(apps.findAllBySyncId).toHaveBeenCalledWith(['app-sync']);
  expect(rooms.create).toHaveBeenCalledWith(
    expect.objectContaining({ dls: selected }),
  );
});

it('rejects a missing parent group', async () => {
  const { service, groups, rooms } = setup();
  groups.findBySyncId.mockResolvedValue(undefined);
  await expect(service.execute(request)).rejects.toMatchObject({
    message: 'Group not found',
  });
  expect(rooms.create).not.toHaveBeenCalled();
});
