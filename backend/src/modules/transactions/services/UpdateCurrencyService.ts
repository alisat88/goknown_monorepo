/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import { EnumStatus } from '../infra/typeorm/entities/Currency';
import ICurrenciesRepository from '../repositories/ICurrenciesRepository';

interface IRequest {
  organization_id: string;
  enableWallet: boolean;
}

@injectable()
class UpdateCurrencyService {
  constructor(
    @inject('CurrenciesRepository')
    private currenciesRepository: ICurrenciesRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    organization_id,
    enableWallet,
  }: IRequest): Promise<any> {
    const organization = await this.organizationsRepository.findById(
      organization_id,
    );
    if (!organization) {
      throw new AppError('Organization not found');
    }

    const currency = await this.currenciesRepository.findByOrganizationId(
      organization_id,
    );

    if (!currency) {
      this.currenciesRepository.create({
        organization_id,
        status: enableWallet ? EnumStatus.Active : EnumStatus.Inactive,
      });
      return true;
    }

    currency.status = enableWallet ? EnumStatus.Active : EnumStatus.Inactive;
    this.currenciesRepository.save(currency);
  }
}

export default UpdateCurrencyService;
