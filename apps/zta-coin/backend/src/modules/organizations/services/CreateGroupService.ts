import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import Group, {
  EnumStatus as EnumGroupStatus,
} from '@modules/organizations/infra/typeorm/entities/Group';

import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';

import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';
import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  admin_id: string;
  name: string;
  organization_id: string;
  sync_id: string;
  user_syncid: string;
}
@injectable()
class CreateGroupService {
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
    admin_id,
    name,
    organization_id,
    sync_id,
    user_syncid,
  }: IRequest): Promise<Group> {
    // verify if the user exists
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // verify if the admin exists
    const adminUser = await this.usersRepository.findBySyncId(admin_id);
    if (!adminUser) {
      throw new AppError('User not found');
    }

    // find organization
    const organization = await this.organizationsRepository.findBySyncId(
      organization_id,
    );

    if (!organization) {
      throw new AppError('Organization not found');
    }

    const organizationUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Admin, EnumRole.Owner],
        status: [EnumStatus.Active, EnumStatus.Pending],
      });

    // is the user an admin
    const isOwnerOrg = !!organizationUsers.find(
      orgUser => orgUser.role === EnumRole.Owner && orgUser.user_id === user.id,
    );

    const isAdminOrg = !!organizationUsers.find(
      orgUser => orgUser.role === EnumRole.Admin && orgUser.user_id === user.id,
    );

    if (!isAdminOrg && !isOwnerOrg) {
      throw new AppError(
        `Only organization owner or ${organization.admin_alias} can create this`,
      );
    }

    // save group
    const group = await this.organizationsGroupsRepository.create({
      name,
      admin_id: adminUser.id,
      organization_id: organization.id,
      sync_id,
      status: EnumGroupStatus.Active,
    });

    return group;
  }
}

// JANA DOE
// "admin_id": "3f4419f9-d51e-5487-a30f-c684b6c22807",

export default CreateGroupService;
