import IDLsRepository from '@modules/dls/repositories/IDLsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';

import { EnumStatus as EnumGroupStatus } from '../infra/typeorm/entities/Group';

import Room from '../infra/typeorm/entities/Room';
import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';
import IRoomsRepository from '../repositories/IRoomsRepository';

interface IRequest {
  group_syncid: string;
  organization_syncid: string;
  room_syncid: string;
  user_syncid: string;
  name: string;
  dls_syncids?: string[];
  users_syncid?: string[];
}

@injectable()
class UpdateRoomService {
  constructor(
    @inject('OrganizationsGroupsRepository')
    private organizationsGroupsRepository: IGroupsRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('DLsRepository')
    private dlsRepository: IDLsRepository,
  ) {}

  public async execute({
    group_syncid,
    organization_syncid,
    room_syncid,
    user_syncid,
    name,
    users_syncid,
    dls_syncids,
  }: IRequest): Promise<Room> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization
    const organization = await this.organizationsRepository.findBySyncId(
      organization_syncid,
    );
    if (!organization) {
      throw new AppError('Organization not found');
    }

    const group = await this.organizationsGroupsRepository.findBySyncId(
      group_syncid,
    );
    if (!group) {
      throw new AppError('Group not found');
    }

    if (group.status === EnumGroupStatus.Inactive) {
      throw new AppError('Group is inactive');
    }

    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Admin, EnumRole.Owner],
        status: [EnumStatus.Active],
      });

    // const isOrganizationUser = !!organizationsUsers.find(
    //   orgUser => orgUser.user_id === user.id,
    // );

    // if (!isOrganizationUser) {
    //   throw new AppError('Unauthorized');
    // }

    // const isOwnerOrg = !!organizationsUsers.find(
    //   orgUser => orgUser.role === EnumRole.Owner && orgUser.user_id === user.id,
    // );
    // const isGroupAdmin = group.id === user.id;

    // if (!isGroupAdmin && !isOwnerOrg) {
    //   throw new AppError(
    //     `Only organization owner or ${group.organization.admin_alias} can edit this`,
    //   );
    // }

    if (group.admin_id !== user.id && organization.owner_id !== user.id) {
      throw new AppError(
        `Only organization owner or ${organization.admin_alias} can edit this`,
      );
    }

    // find dls
    const dls = await this.dlsRepository.findAllBySyncId(dls_syncids);

    const room = await this.organizationsRoomsRepository.findBySyncId(
      room_syncid,
    );

    if (!room) {
      throw new AppError('Room not found');
    }

    if (name) room.name = name;
    if (dls) room.dls = dls;

    await this.organizationsRoomsRepository.save(room);

    return room;
  }
}

export default UpdateRoomService;
