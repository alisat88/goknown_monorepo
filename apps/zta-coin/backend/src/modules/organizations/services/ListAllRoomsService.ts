import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group, { EnumStatus } from '../infra/typeorm/entities/Group';
import Room from '../infra/typeorm/entities/Room';
// import {
//   EnumRole,
//   EnumStatus,
// } from '../infra/typeorm/entities/OrganizationUser';
import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
// import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  user_syncid: string;
  organization_syncid: string;
  group_syncid: string;
}

@injectable()
class ListAllRoomsService {
  constructor(
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsGroupsRepository')
    private organizationsGroupsRepository: IGroupsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    user_syncid,
    organization_syncid,
    group_syncid,
  }: IRequest): Promise<Group> {
    // verify if the user exists
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization
    const group = await this.organizationsGroupsRepository.findBySyncId(
      group_syncid,
    );

    if (!group) {
      throw new AppError('Group not found');
    }

    if (group.status === EnumStatus.Inactive) {
      throw new AppError('Group is inactive');
    }

    if (group.organization.sync_id !== organization_syncid) {
      throw new AppError('Unauthorized');
    }

    // const organizationUsers =
    //   await this.organizationsUsersRepository.findAllUsersByOrganization({
    //     organization_id: organization.id,
    //     roles: [EnumRole.Admin],
    //     status: [EnumStatus.Active, EnumStatus.Pending],
    //   });

    // is the user an admin
    // const isAdmin = !!organizationUsers.find(
    //   orgUser => orgUser.role === EnumRole.Admin && user.id === orgUser.user_id,
    // );

    // // case not an admin or owner
    // if (!isAdmin && organization.owner_id !== user.id) {
    //   throw new AppError('Unauthorized');
    // }

    // const groups = isAdmin
    //   ? organization.groups.map(group => group.admin_id === user.id)
    //   : organization.groups;

    return group;
  }
}

export default ListAllRoomsService;
