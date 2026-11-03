/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateCurrencyDTO from '../dtos/ICreateCurrencyDTO';
import Currency from '../infra/typeorm/entities/Currency';

export default interface ICurrenciesRepository {
  findById(id: string): Promise<Currency | undefined>;
  findBySyncId(sync_id: string): Promise<Currency | undefined>;
  findByOrganizationId(organization_id: string): Promise<Currency | undefined>;
  create(data: ICreateCurrencyDTO): Promise<Currency>;
  save(data: Currency): Promise<Currency>;
}
