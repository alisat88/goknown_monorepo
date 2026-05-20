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
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';
import IRoomsRepository from '../repositories/IRoomsRepository';

interface IRequest {
  user_syncid: string;
  organization_syncid: string;
  group_syncid: string;
  name: string;
  dls_syncids?: string[];
  sync_id: string;
}

@injectable()
class CreateRoomService {
  constructor(
    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
    @inject('OrganizationsGroupsRepository')
    private organizationsGroupsRepository: IGroupsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('DLsRepository')
    private dlsRepository: IDLsRepository,
  ) {}

  public async execute(data: IRequest): Promise<Room> {
    const {
      group_syncid,
      name,
      sync_id,
      user_syncid,
      dls_syncids = [],
      organization_syncid,
    } = data;

    // find user
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find group
    const group = await this.organizationsGroupsRepository.findBySyncId(
      group_syncid,
    );

    if (!group) {
      throw new AppError('Group not found');
    }

    if (group.status === EnumGroupStatus.Inactive) {
      throw new AppError('Group is inactive');
    }

    if (group.organization.sync_id !== organization_syncid) {
      throw new AppError('Unauthorized');
    }

    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: group.organization_id,
        roles: [EnumRole.Owner, EnumRole.Admin],
        status: [EnumStatus.Active, EnumStatus.Pending],
      });

    // find if the user is an admin
    const isOwnerOrg = !!organizationsUsers.find(
      orgUser => orgUser.role === EnumRole.Owner && orgUser.user_id === user.id,
    );

    const isAdminGroup = group.admin_id === user.id;

    if (!isAdminGroup && !isOwnerOrg) {
      throw new AppError(
        `Only organization owner or ${group.admin.name} can create this`,
      );
    }

    // find dls
    const dls = await this.dlsRepository.findAllBySyncId(dls_syncids);

    const room = await this.organizationsRoomsRepository.create({
      sync_id,
      admin_id: group.admin_id,
      name,
      group_id: group.id,
      dls,
    });

    return room;
  }
}

export default CreateRoomService;
