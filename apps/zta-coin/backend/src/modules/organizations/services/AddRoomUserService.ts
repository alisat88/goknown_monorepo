import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import OrganizationUser, {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';

import { EnumStatus as EnumGroupStatus } from '../infra/typeorm/entities/Group';

import Room from '../infra/typeorm/entities/Room';
import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';
import IRoomsRepository from '../repositories/IRoomsRepository';
import AddOrganizationUserService from './AddOrganizationUserService';

interface IRequest {
  user_syncid: string;
  user_syncid_add: string;
  room_syncid: string;
  group_syncid: string;
}

@injectable()
class AddRoomUserService {
  constructor(
    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
    @inject('OrganizationsGroupsRepository')
    private organizationsGroupsRepository: IGroupsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    user_syncid,
    group_syncid,
    user_syncid_add,
    room_syncid,
  }: IRequest): Promise<Room> {
    const user = await this.usersRepository.findBySyncId(user_syncid);

    // find user
    if (!user) {
      throw new AppError('User not found');
    }

    // find grup
    const group = await this.organizationsGroupsRepository.findBySyncId(
      group_syncid,
    );
    if (!group) {
      throw new AppError('Group not found');
    }

    if (group.status === EnumGroupStatus.Inactive) {
      throw new AppError('Group is inactive');
    }

    // find room
    const room = await this.organizationsRoomsRepository.findBySyncId(
      room_syncid,
    );

    if (!room) {
      throw new AppError('Room not found');
    }

    // find all users from organization
    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: group.organization.id,
        roles: [EnumRole.Owner, EnumRole.User, EnumRole.Admin],
        status: [EnumStatus.Active, EnumStatus.Pending],
      });

    const isGroupAdmin = group.admin_id === user.id;
    const isOwnerOrg = !!organizationsUsers.find(
      orgUser => orgUser.role === EnumRole.Owner && orgUser.user_id === user.id,
    );
    // verify user permission if the user is the group owner or org owner
    if (!isOwnerOrg && !isGroupAdmin) {
      throw new AppError(
        `Only organization owner or ${group.organization.admin_alias} can edit this`,
      );
    }

    // find user to add
    const userToAdd = await this.usersRepository.findBySyncId(user_syncid_add);

    if (!userToAdd) {
      throw new AppError('User not found');
    }

    // validate that only users can be added to room
    const isAdminOrOwnerForOrganization = !!organizationsUsers.find(
      orgUser =>
        [EnumRole.Owner, EnumRole.User].includes(orgUser.role) &&
        orgUser.id === userToAdd.id,
    );

    if (isAdminOrOwnerForOrganization) {
      throw new AppError('Only users can be added to a room');
    }

    // add user in case it's not in the org yet
    const userToAddAlreadyAdded = !!organizationsUsers.find(
      orgUser => orgUser.user_id === userToAdd.id,
    );
    let newOrganizationRoom: OrganizationUser | undefined;
    if (!userToAddAlreadyAdded) {
      const addOrganizationUserService = container.resolve(
        AddOrganizationUserService,
      );
      newOrganizationRoom = await addOrganizationUserService.execute({
        user_syncid,
        user_syncid_add,
        role: EnumRole.User,
        sync_id: group.organization.sync_id,
      });
    }

    newOrganizationRoom =
      await this.organizationsUsersRepository.findOrganizationByUser(
        userToAdd.id,
        group.organization_id,
      );

    if (!newOrganizationRoom) {
      throw new AppError('Organization Users not found');
    }

    // console.log(newOrganizationRoom);

    const members = room.members
      ? [...room.members, newOrganizationRoom]
      : [newOrganizationRoom];

    room.members = members;
    await this.organizationsRoomsRepository.save(room);
    // add user to sub  group
    return room;
  }
}

export default AddRoomUserService;
