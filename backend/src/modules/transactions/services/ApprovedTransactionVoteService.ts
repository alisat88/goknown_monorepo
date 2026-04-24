import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import { EnumStatus } from '../infra/typeorm/entities/Transaction';
import ITransactionsRepository from '../repositories/ITransactionsRepository';
import SendTransactionEmailService from './SendTransactionEmailService';
import IMemoryRedisProvider from '@shared/container/providers/MemoryRedisProvider/models/IMemoryRedisProvider';

@injectable()
class ApprovedTransactionVoteService {
  constructor(
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('MemoryRedisProvider')
    private memoryProvider: IMemoryRedisProvider,
  ) {}

  public async execute(syncId: string): Promise<void> {
    // find transaction
    const transaction = await this.transactionsRepository.findBySyncId(syncId);

    if (!transaction) {
      throw new AppError('Transaction not found');
    }

    // find origin user
    const fromTransaction = await this.transactionsRepository.findBySyncId(
      `${transaction.sync_id}_from`,
    );

    // can't find orin user
    if (!fromTransaction) {
      throw new AppError('We were unable to load transaction from user');
    }

    // update transaction as approved to destine user
    const approvedToTransaction = await this.transactionsRepository.save({
      ...transaction,
      status: EnumStatus.Approved,
    });

    // update transaction origin as approved
    const approvedFromTransaction = await this.transactionsRepository.save({
      ...fromTransaction,
      status: EnumStatus.Approved,
    });

    // send success email to destine user
    // const sendTransactionEmail = container.resolve(SendTransactionEmailService);
    // await sendTransactionEmail.execute({
    //   toUser: approvedToTransaction.touser,
    //   fromUser: approvedToTransaction.fromuser,
    //   amount: approvedFromTransaction.amount,
    //   date: approvedFromTransaction.created_at,
    //   message: transaction.message,
    // });

    // remove vote from node memory
    const memoryKey = `transaction-vote:${transaction.sync_id}-${transaction.touser.sync_id}-${transaction.fromuser.sync_id}`;
    await this.memoryProvider.invalidate(memoryKey);
  }
}

export default ApprovedTransactionVoteService;
