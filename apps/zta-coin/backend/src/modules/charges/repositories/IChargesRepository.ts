/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateChargeDTO from '../dtos/ICreateChargeDTO';
import Charge from '../infra/typeorm/entities/Charge';

export default interface IChargesRepository {
  findById(charge_id: string): Promise<Charge | undefined>;
  findLatestCharges(
    user_id: string,
    organization_id?: string,
  ): Promise<Charge[] | undefined>;
  create(chargeData: ICreateChargeDTO): Promise<Charge>;
}
