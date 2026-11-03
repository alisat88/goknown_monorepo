/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Charge from '../infra/typeorm/entities/Charge';
import IChargesRepository from '../repositories/IChargesRepository';

interface IRequest {
  user_id: string;
  organization_id?: string;
}

@injectable()
class ListLatestChargesService {
  constructor(
    @inject('ChargesRepository')
    private chargesRepository: IChargesRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    user_id,
    organization_id,
  }: IRequest): Promise<Charge[] | undefined> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    let org_id = null;
    if (organization_id) {
      const organization = await this.organizationsRepository.findBySyncId(
        organization_id,
      );
      if (organization) {
        org_id = organization.id;
      }
    }

    const charges = await this.chargesRepository.findLatestCharges(
      user.id,
      org_id,
    );

    return charges;
  }
}

export default ListLatestChargesService;
