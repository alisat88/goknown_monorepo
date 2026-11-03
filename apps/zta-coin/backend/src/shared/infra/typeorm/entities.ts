/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Account } from '@modules/transactions/infra/typeorm/entities/Account';
import { Transaction } from '@modules/transactions/infra/typeorm/entities/Transaction';
import { ZtaAuthSession } from '@modules/auth/entities/ZtaAuthSession';
import { ZtaHandoffTransaction } from '@modules/auth/entities/ZtaHandoffTransaction';
import { ZtaPersonalAccount } from '@modules/personalBalance/entities/ZtaPersonalAccount';

export const typeormEntities = [Account, Transaction, ZtaAuthSession, ZtaHandoffTransaction, ZtaPersonalAccount];
