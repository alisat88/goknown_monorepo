import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group, {
  EnumStatus as EnumGroupStatus,
} from '../infra/typeorm/entities/Group';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';

import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

export interface IRequest {
  group_syncid: string;
  user_syncid: string;
  organization_syncid: string;
  admin_syncid: string;
  name: string;
}

@injectable()
class UpdateOrganizationService {
  constructor(
    @inject('OrganizationsGroupsRepository')
    private organizationsGroupsRepository: IGroupsRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    group_syncid,
    organization_syncid,
    user_syncid,
    name,
    admin_syncid,
  }: IRequest): Promise<Group | undefined> {
    const user = await this.usersRepository.findBySyncId(user_syncid);

    if (!user) {
      throw new AppError('User not found');
    }

    const organization = await this.organizationsRepository.findBySyncId(
      organization_syncid,
    );

    if (!organization) {
      throw new AppError('Organization not found');
    }

    const newAdminUser = await this.usersRepository.findBySyncId(admin_syncid);

    if (!newAdminUser) {
      throw new AppError('Admin not found');
    }

    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Admin, EnumRole.User, EnumRole.Owner],
        status: [EnumStatus.Active],
      });

    const isOrganizationAdminUser = !!organizationsUsers.find(
      orgUser =>
        orgUser.user_id === newAdminUser.id &&
        [EnumRole.Admin, EnumRole.Owner].includes(orgUser.role),
    );

    if (!isOrganizationAdminUser) {
      throw new AppError('Unauthorized');
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

    if (group.admin_id !== user.id && organization.owner_id !== user.id) {
      throw new AppError(
        `Only organization owner or ${organization.admin_alias} can edit this`,
      );
    }

    if (name) group.name = name;
    if (admin_syncid) group.admin = newAdminUser;

    await this.organizationsGroupsRepository.save(group);

    return group;
  }
}

export default UpdateOrganizationService;
