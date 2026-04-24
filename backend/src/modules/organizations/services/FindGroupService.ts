import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group from '../infra/typeorm/entities/Group';
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
}

@injectable()
class FindOrganizationService {
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

    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Admin, EnumRole.User, EnumRole.Owner],
        status: [EnumStatus.Active, EnumStatus.Pending],
      });

    const isOrganizationUser = !!organizationsUsers.find(
      orgUser => orgUser.user_id === user.id,
    );

    if (!isOrganizationUser) {
      throw new AppError('Unauthorized');
    }

    // find groups
    const group = await this.organizationsGroupsRepository.findBySyncId(
      group_syncid,
    );

    if (!group) {
      throw new AppError('Group not found');
    }

    if (group.status === EnumStatus.Inactive) {
      throw new AppError('Group is inactive');
    }

    return group;
  }
}

export default FindOrganizationService;
