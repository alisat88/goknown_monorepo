import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import Transaction, { EnumStatus } from '../infra/typeorm/entities/Transaction';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import ITransactionsRepository from '../repositories/ITransactionsRepository';
import IMemoryRedisProvider from '@shared/container/providers/MemoryRedisProvider/models/IMemoryRedisProvider';
import SendRejectorFailTransactionEmailService from './SendRejectorFailTransactionEmailService';
@injectable()
class UnApprovedTransactionVoteService {
  constructor(
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('MemoryRedisProvider')
    private memoryProvider: IMemoryRedisProvider,
  ) {}

  public async execute(
    syncId: string,
    failedMessages: Array<string | undefined>,
  ): Promise<void> {
    // find transaction
    const transaction = await this.transactionsRepository.findBySyncId(syncId);

    if (!transaction) {
      throw new AppError('Transaction not found');
    }
    // update transaction as failed to destine user
    const unApprovedToTransaction = await this.transactionsRepository.save({
      ...transaction,
      status: EnumStatus.Unapproved,
      message: failedMessages.toString(),
      balance: 0,
    });
    // find origin user
    const fromTransaction = await this.transactionsRepository.findBySyncId(
      `${transaction.sync_id}_from`,
    );
    // can't find orin user
    if (!fromTransaction) {
      throw new AppError('We were unable to load transaction from user');
    }
    // update transaction origin as failed
    await this.transactionsRepository.save({
      ...fromTransaction,
      status: EnumStatus.Unapproved,
      message: failedMessages.toString(),
      balance: 0,
    });

    // send email with rejection and error message
    // const sendRejectorFailTransactionEmail = container.resolve(
    //   SendRejectorFailTransactionEmailService,
    // );
    // await sendRejectorFailTransactionEmail.execute({
    //   fromUser: unApprovedToTransaction.fromuser,
    //   toUser: unApprovedToTransaction.touser,
    //   amount: unApprovedToTransaction.amount,
    //   date: unApprovedToTransaction.created_at,
    //   failedMessages,
    // });
    // remove vote from node memory
    const memoryKey = `transaction-vote:${transaction.sync_id}-${transaction.touser.sync_id}-${transaction.fromuser.sync_id}`;
    await this.memoryProvider.invalidate(memoryKey);
  }
}

export default UnApprovedTransactionVoteService;
