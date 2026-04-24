import { inject, injectable } from 'tsyringe';
import Transaction, {
  EnumCategory,
  EnumTransactionType,
  EnumStatus,
} from '../infra/typeorm/entities/Transaction';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import ITransactionsRepository from '../repositories/ITransactionsRepository';
import IMemoryRedisProvider from '@shared/container/providers/MemoryRedisProvider/models/IMemoryRedisProvider';
import IVoteDTO from '@modules/votes/infra/dtos/IVoteDTO';
import AppError from '@shared/errors/AppError';
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';

// request interface
interface IRequest {
  to_user_id: string;
  from_user_id: string;
  sync_id: string;
  timestamp: number;
  amount: string;
  message?: string;
  errorMessage?: string;
  organization_id?: string;
}

// return interface
interface IResponse {
  transaction: Transaction;
  vote: IVoteDTO;
}

@injectable()
class CreateFailedTransactionService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('MemoryRedisProvider')
    private memoryProvider: IMemoryRedisProvider,

    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    to_user_id,
    from_user_id,
    amount,
    message,
    errorMessage,
    timestamp,
    organization_id,
    sync_id,
  }: IRequest): Promise<IResponse> {
    // user lookup using sync_id for authenticated user
    const toUser = await this.usersRepository.findBySyncId(to_user_id);
    // transaction source user balance lookup
    const fromUser = await this.usersRepository.findBySyncId(from_user_id);

    if (to_user_id === from_user_id) {
      throw new AppError('You cannot send to yourself');
    }

    if (!toUser) {
      throw new AppError(
        'The user you are trying to send tokens does not exist',
      );
    }

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

    // remove balance from user - leave failed
    const transaction = await this.transactionsRepository.create({
      amount: Number(amount) * -1,
      balance: 0,
      from_user_id: fromUser ? fromUser.id : '',
      to_user_id: toUser ? toUser.id : '',
      category: EnumCategory.Transaction,
      transactionType: EnumTransactionType.Sent,
      sync_id,
      message: errorMessage,
      status: EnumStatus.Failed,
      organization_id: org_id,
    });

    // add failed balance to destination
    await this.transactionsRepository.create({
      amount: Number(amount),
      balance: 0,
      from_user_id: toUser ? toUser.id : '',
      to_user_id: fromUser ? fromUser.id : '',
      category: EnumCategory.Transaction,
      transactionType: EnumTransactionType.Received,
      message: errorMessage,
      status: EnumStatus.Failed,
      sync_id: `${sync_id}_from`,
      organization_id: org_id,
    });

    console.log('save uuid', sync_id);
    // save transaction on memory
    // create memory key
    const memoryKey = `transaction-vote:${sync_id}-${to_user_id}-${from_user_id}`;

    // retrieve votes previously saved on memory
    const votes =
      (await this.memoryProvider.recover<IVoteDTO[]>(memoryKey)) || [];
    // assemble vote structure
    const vote = {
      type: 'transaction',
      nodeName: process.env.NODE_NAME || '',
      syncId: transaction.sync_id,
      vote: 'failed',
      toUserSyncId: to_user_id,
      fromUserSyncId: from_user_id,
      timestamp,
      error: errorMessage,
    } as IVoteDTO;

    // save on memory as failed
    await this.memoryProvider.save(
      memoryKey,

      !!votes && votes.length > 0 ? [...votes, vote] : [vote],
    );

    return { transaction, vote };
  }
}

export default CreateFailedTransactionService;
