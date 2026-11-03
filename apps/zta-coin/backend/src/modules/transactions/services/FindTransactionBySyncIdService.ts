/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { inject, injectable } from 'tsyringe';
import Transaction from '../infra/typeorm/entities/Transaction';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import ITransactionsRepository from '../repositories/ITransactionsRepository';

interface IRequest {
  sync_id: string;
}

@injectable()
class FindTransactionBySyncIdService {
  constructor(
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    sync_id,
  }: IRequest): Promise<Transaction | undefined> {
    const transaction = this.transactionsRepository.findBySyncId(sync_id);

    return transaction;
  }
}

export default FindTransactionBySyncIdService;
