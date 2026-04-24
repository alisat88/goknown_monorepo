import CreateCurrencyService from '@modules/transactions/services/CreateCurrencyService';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';

import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import Organization from '../infra/typeorm/entities/Organization';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

interface IRequest {
  user_syncid: string;
  sync_id: string;
  admins_syncid?: string[];
  name: string;
  admin_alias?: string;
  enableWallet?: boolean;
  avatar?: string;
}

@injectable()
class CreateOrganizationService {
  constructor(
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    name,
    admin_alias = 'Group Admins',
    avatar,
    user_syncid,
    enableWallet = false,
    sync_id,
    admins_syncid = [],
  }: IRequest): Promise<Organization> {
    // verify if the user exists to add as an owner
    const owner = await this.usersRepository.findBySyncId(user_syncid);
    if (!owner) {
      throw new AppError('User not found');
    }

    // create organization
    const organization = await this.organizationsRepository.create({
      name,
      admin_alias,
      avatar,
      enableWallet,
      owner_id: owner.id,
      sync_id,
    });

    // lookup all organizations

    const admins =
      admins_syncid.length > 0
        ? await this.usersRepository.findAll({
            sync_ids: admins_syncid,
          })
        : [];

    const formattedAdminsObject = admins
      ? admins
          .map(admin => ({
            user_id: admin.id,
            organization_id: organization.id,
            role: EnumRole.Admin,
            status: EnumStatus.Active,
          }))
          .filter(admin => admin.user_id !== owner.id)
      : [];

    // create organization users
    await this.organizationsUsersRepository.createMany([
      {
        user_id: owner.id,
        organization_id: organization.id,
        role: EnumRole.Owner,
        status: EnumStatus.Active,
      },
      ...formattedAdminsObject,
    ]);

    return organization;
  }
}

export default CreateOrganizationService;
