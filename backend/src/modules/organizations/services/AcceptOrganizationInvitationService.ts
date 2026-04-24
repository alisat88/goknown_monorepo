import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import { EnumStatus } from '../infra/typeorm/entities/OrganizationUser';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  user_syncid: string;
  organization_syncid: string;
}

@injectable()
class AcceptOrganizationInvitationService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
  ) {}

  public async execute({
    organization_syncid,
    user_syncid,
  }: IRequest): Promise<void> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization by sync_id
    const organization = await this.organizationsRepository.findBySyncId(
      organization_syncid,
    );

    if (!organization) {
      throw new AppError('Organization not found');
    }

    const organizationUser =
      await this.organizationsUsersRepository.findOrganizationByUser(
        user.id,
        organization.id,
      );

    if (!organizationUser) {
      throw new AppError('organizationUser not found');
    }

    organizationUser.status = EnumStatus.Active;

    await this.organizationsUsersRepository.save(organizationUser);
  }
}

export default AcceptOrganizationInvitationService;
