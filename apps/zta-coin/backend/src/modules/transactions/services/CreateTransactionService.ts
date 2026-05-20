import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import Transaction, {
  EnumCategory,
  EnumTransactionType,
  EnumStatus,
} from '../infra/typeorm/entities/Transaction';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import ITransactionsRepository from '../repositories/ITransactionsRepository';
import IMemoryRedisProvider from '@shared/container/providers/MemoryRedisProvider/models/IMemoryRedisProvider';
import IVoteDTO from '@modules/votes/infra/dtos/IVoteDTO';
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import IAuditLogsRepository from '@modules/auditlogs/repositories/IAuditLogsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

// request interface
interface IRequest {
  to_user_id: string;
  from_user_id: string;
  sync_id: string;
  amount: string;
  timestamp: number;
  message: string;
  organization_id?: string;
  // vote?: IVote;
}

// return interface
interface IResponse {
  transaction: Transaction;
  vote: IVoteDTO;
}

@injectable()
class CreateTransactionService {
  constructor(
    // connection with user data repo (db) connection
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    // connection with transaction data repo (db) connection
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,
    // connection with memory db
    @inject('MemoryRedisProvider')
    private memoryProvider: IMemoryRedisProvider,

    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  // exec the transaction service function
  public async execute({
    to_user_id,
    from_user_id,
    amount,
    message,
    timestamp,
    organization_id,
    sync_id,
  }: IRequest): Promise<IResponse> {
    // user lookup using sync_id for authenticated user
    const toUser = await this.usersRepository.findBySyncId(to_user_id);

    if (to_user_id === from_user_id) {
      throw new AppError('You cannot send to yourself');
    }

    if (!toUser) {
      throw new AppError(
        'The user you are trying to send tokens does not exist',
      );
    }

    // user lookup using sync_id to user
    const fromUser = await this.usersRepository.findBySyncId(from_user_id);

    if (!fromUser) {
      throw new AppError(
        'We were unable to load your information, please try again later',
      );
    }

    let org_id = null;
    if (organization_id) {
      const organization = await this.organizationsRepository.findBySyncId(
        organization_id,
      );
      if (organization) {
        org_id = organization.id;
      }
    }

    // transaction source user balance lookup
    const fromUserCurrentBalance =
      await this.transactionsRepository.findBalance(fromUser.id, org_id);

    // transaction destination user balance lookup
    const toUserCurrentBalance = await this.transactionsRepository.findBalance(
      toUser.id,
      org_id,
    );

    if (Number(amount) < 1) {
      throw new AppError('You can only send a minimum of 1 token');
    }

    if (Number(fromUserCurrentBalance) < Number(amount)) {
      throw new AppError(
        "You don't have enough balance to complete this transaction",
      );
    }

    // remove balance from user - leave pending
    const transaction = await this.transactionsRepository.create({
      amount: Number(amount) * -1,
      balance: Number(fromUserCurrentBalance) - Number(amount),
      from_user_id: fromUser.id,
      to_user_id: toUser.id,
      category: EnumCategory.Transaction,
      transactionType: EnumTransactionType.Sent,
      status: EnumStatus.Pending,
      organization_id: org_id,
      sync_id,
    });

    // add pending balance to destination
    await this.transactionsRepository.create({
      amount: Number(amount),
      balance: Number(toUserCurrentBalance) + Number(amount),
      from_user_id: toUser.id,
      to_user_id: fromUser.id,
      organization_id: org_id,
      category: EnumCategory.Transaction,
      transactionType: EnumTransactionType.Received,
      message,
      status: EnumStatus.Pending,
      sync_id: `${sync_id}_from`,
    });

    // Create Audit Log
    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'send',
      dapp: 'Transaction',
      sync_id: transaction.sync_id,
      user_sync_id: fromUser.sync_id,
      dapp_token: transaction.id,
      dapp_token_sync_id: transaction.sync_id,
      message: transaction,
      outcome: 'success',
    });

    await auditLogService.execute({
      action: 'received',
      dapp: 'Transaction',
      sync_id: transaction.sync_id,
      user_sync_id: toUser.sync_id,
      dapp_token: transaction.id,
      dapp_token_sync_id: transaction.sync_id,
      message: transaction,
      outcome: 'success',
    });

    // save transaction on memory
    // create memory key
    const memoryKey = `transaction-vote:${sync_id}-${toUser.sync_id}-${fromUser.sync_id}`;
    // retrieve votes previously saved on memory
    const votes =
      (await this.memoryProvider.recover<IVoteDTO[]>(memoryKey)) || [];
    // assemble vote structure
    const vote = {
      type: 'transaction',
      nodeName: process.env.NODE_NAME || '',
      syncId: transaction.sync_id,
      vote: 'approved',
      toUserSyncId: toUser.sync_id,
      fromUserSyncId: fromUser.sync_id,
      timestamp,
    } as IVoteDTO;

    // votes.push(vote);

    // save on memory as pending
    await this.memoryProvider.save(
      memoryKey,
      !!votes && votes.length > 0 ? [...votes, vote] : [vote],
      // [vote],
    );

    return { transaction, vote };
  }
}

export default CreateTransactionService;
