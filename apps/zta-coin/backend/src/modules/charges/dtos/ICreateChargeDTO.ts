/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { EnumMethod, EnumProcess } from '../infra/typeorm/entities/Charge';

export default interface ICreateChargeDTO {
  user_id: string;
  amount: number;
  method: EnumMethod;
  organization_id?: any;
  process?: EnumProcess;
}
