import User from '@modules/users/infra/typeorm/entities/User';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { classToClass } from 'class-transformer';
import { inject, injectable } from 'tsyringe';
import Organization from '../infra/typeorm/entities/Organization';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';
import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  user_syncid: string;
  organization_syncid: string;
}

interface IResponse extends Organization {
  number_of_members: number;
  number_of_admins: number;
  admins?: User[];
  owners?: User[];
  users?: User[];
}

@injectable()
class ListAllGroupsService {
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
    user_syncid,
    organization_syncid,
  }: IRequest): Promise<IResponse> {
    // verify if user exists
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

    const organizationUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Admin, EnumRole.Owner, EnumRole.User],
        status: [EnumStatus.Active, EnumStatus.Inactive, EnumStatus.Pending],
      });

    const users = organizationUsers.map(orgUser => ({
      id: orgUser.user.id,
      sync_id: orgUser.user.sync_id,
      name: orgUser.user.name,
      email: orgUser.user.email,
      avatar: orgUser.user.avatar,
      avatar_url: orgUser.user.getAvatarUrl(),
      organization_role: orgUser.role,
      status: orgUser.status,
    }));

    const admins = users.filter(
      orgUser => orgUser.organization_role === EnumRole.Admin,
    );

    const members = users.filter(
      orgUser => orgUser.organization_role === EnumRole.User,
    );

    const owners = users.filter(
      orgUser => orgUser.organization_role === EnumRole.Owner,
    );

    const formattedOrganizationGroup = {
      ...classToClass(organization),
      groups: organization.groups.filter(
        group => group.status === EnumStatus.Active,
      ),
      number_of_members: users.length,
      number_of_admins: admins.length,
      users: members,
      admins,
      owners,
    };
    return formattedOrganizationGroup;
  }
}

export default ListAllGroupsService;
