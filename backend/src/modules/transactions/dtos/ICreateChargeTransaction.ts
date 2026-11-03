/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import {
  EnumCategory,
  EnumTransactionType,
  EnumStatus,
} from '../infra/typeorm/entities/Transaction';

export default interface ICreateChargeTransactionDTO {
  category: EnumCategory.Charge;
  transactionType: EnumTransactionType.Received;
  balance: number;
  amount: number;
  to_user_id: string;
  charge_id: string;
  sync_id?: string;
  status: EnumStatus;
  organization_id?: string | null;
}
