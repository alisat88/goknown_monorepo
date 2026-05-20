import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import OrganizationUser, {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';

import { EnumStatus as EnumUserStatus } from '@modules/users/infra/typeorm/entities/User';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  user_syncid: string;
  user_syncid_add: string;
  sync_id: string;
  userValidation?: boolean;
  role: EnumRole;
  status?: EnumStatus;
}

@injectable()
class AddOrganizationUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
  ) {}

  public async execute({
    sync_id,
    user_syncid,
    user_syncid_add,
    role,
    status = EnumStatus.Active,
  }: IRequest): Promise<OrganizationUser> {
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

    // find users belonging to an organization
    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Owner, EnumRole.Admin],
        status: [EnumStatus.Active, EnumStatus.Pending],
      });

    const isOwnerOrg = !!organizationsUsers.find(
      orgUser => orgUser.role === EnumRole.Owner && orgUser.user_id === user.id,
    );

    const isAdminOrg = !!organizationsUsers.find(
      orgUser => orgUser.role === EnumRole.Admin && orgUser.user_id === user.id,
    );

    // verify user permissions
    if (!isOwnerOrg && !isAdminOrg) {
      throw new AppError(
        `Only an Organization Admin can make changes to the Organization`,
      );
    }

    // if (isAdminOrg && role === EnumRole.Admin || role === EnumRole.Owner){

    // }

    const userToAdd = await this.usersRepository.findBySyncId(user_syncid_add);

    if (!userToAdd) {
      throw new AppError('User not found');
    }

    const userAlreadyExists =
      await this.organizationsUsersRepository.findOrganizationByUser(
        userToAdd.id,
        organization.id,
      );

    if (userAlreadyExists) {
      throw new AppError('User already added');
    }

    const organizationUser = await this.organizationsUsersRepository.create({
      user_id: userToAdd.id,
      organization_id: organization.id,
      role,
      status: EnumStatus.Pending,
      // status:
      //   userToAdd.status === EnumUserStatus.Pending
      //     ? EnumStatus.Pending
      //     : EnumStatus.Active,
    });

    return organizationUser;
  }
}

export default AddOrganizationUserService;
