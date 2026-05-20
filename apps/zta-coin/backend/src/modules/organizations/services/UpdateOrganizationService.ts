import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Organization from '../infra/typeorm/entities/Organization';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';

interface IRequest {
  name?: string;
  admin_alias?: string;
  user_syncid: string;
  sync_id: string;
  enableWallet: boolean;
}

@injectable()
class UpdateOrganizationService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    name,
    admin_alias,
    sync_id,
    user_syncid,
    enableWallet,
  }: IRequest): Promise<Organization> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization bt sync_id
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

    if (name) organization.name = name;
    if (admin_alias) organization.admin_alias = admin_alias;

    organization.enableWallet = enableWallet;

    this.organizationsRepository.save(organization);

    return organization;
  }
}

export default UpdateOrganizationService;
