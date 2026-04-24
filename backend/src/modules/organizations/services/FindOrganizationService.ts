import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { classToClass } from 'class-transformer';
import { inject, injectable } from 'tsyringe';
import Organization from '../infra/typeorm/entities/Organization';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IUserItem {
  id: string;
  sync_id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_url: string;
  organization_role: string;
  status: string;
}
interface IResponse extends Organization {
  number_of_members?: number;
  number_of_admins?: number;
  users: IUserItem[];
  admins: IUserItem[];
  owners: IUserItem[];
}

@injectable()
class FindOrganizationService {
  constructor(
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
  ) {}

  public async execute(
    sync_id: string,
    user_syncid: string,
  ): Promise<IResponse> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization
    const organization = await this.organizationsRepository.findBySyncId(
      sync_id,
    );
    if (!organization) {
      throw new AppError('Organization not found');
    }

    // verificar se usuario tem permissao
    // if (organization.owner_id !== user.id) {
    //   throw new AppError(`Only owner can update this organization`);
    // }

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

    const formattedOrganization = {
      ...classToClass(organization),
      number_of_members: users.length,
      number_of_admins: admins.length,
      users: members,
      admins,
      owners,
    };

    return formattedOrganization;
  }
}

export default FindOrganizationService;
