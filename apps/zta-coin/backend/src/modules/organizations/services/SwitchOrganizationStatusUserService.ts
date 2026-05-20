import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';
import { EnumStatus as EnumGroupStatus } from '../infra/typeorm/entities/Group';
import IGroupsRepository from '../repositories/IGroupsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  user_syncid: string;
  sync_id: string;
  user_syncid_edited: string;
  status: EnumStatus.Active | EnumStatus.Inactive;
}

@injectable()
class SwitchOrganizationStatusUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsGroupsRepository')
    private organizationsGroupsRepository: IGroupsRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
  ) {}

  public async execute({
    sync_id,
    user_syncid,
    user_syncid_edited,
    status,
  }: IRequest): Promise<any> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization by sync_id
    const organization = await this.organizationsRepository.findBySyncId(
      sync_id,
    );

    if (!organization) {
      throw new AppError('Organization not found');
    }

    // verify user permissions
    if (organization.owner_id !== user.id) {
      throw new AppError(
        `Only an Organization Admin can make changes to the Organization`,
      );
    }

    // find user edited

    const user_edit = await this.usersRepository.findBySyncId(
      user_syncid_edited,
    );
    if (!user_edit) {
      throw new AppError('User not found');
    }

    const organizationUser =
      await this.organizationsUsersRepository.findOrganizationByUser(
        user_edit.id,
        organization.id,
      );

    if (!organizationUser) {
      throw new AppError('organizationUser not found');
    }

    if (organizationUser.role === EnumRole.Owner) {
      throw new AppError('Unauthorized');
    }

    organizationUser.status = status;

    await this.organizationsUsersRepository.save(organizationUser);
    await this.organizationsGroupsRepository.switchStateByAdmin({
      admin_id: user_edit.id,
      organization_id: organization.id,
      status:
        status === EnumStatus.Active
          ? EnumGroupStatus.Active
          : EnumGroupStatus.Inactive,
    });

    return organizationUser;
  }
}

export default SwitchOrganizationStatusUserService;
