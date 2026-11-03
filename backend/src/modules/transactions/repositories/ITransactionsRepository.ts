/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateTransationDTO from '../dtos/ICreateTransationDTO';
import ICreateChargeTransaction from '../dtos/ICreateChargeTransaction';
import Transaction from '../infra/typeorm/entities/Transaction';

export default interface IUsersRepository {
  findBalance(
    user_id: string,
    organization_id?: string | null,
  ): Promise<number>;
  findAll(user_id: string): Promise<Transaction[] | undefined>;
  findBySyncId(sync_id: string): Promise<Transaction | undefined>;
  findLatestTransactions(
    user_id: string,
    organization_id?: string | null,
  ): Promise<Transaction[] | undefined>;
  create(data: ICreateTransationDTO): Promise<Transaction>;
  save(data: Transaction): Promise<Transaction>;
  createChargeTransaction(data: ICreateChargeTransaction): Promise<Transaction>;
}
