import ICreateTransactionDTO from '@modules/transactions/dtos/ICreateTransationDTO';
import ICreateChargeTransaction from '@modules/transactions/dtos/ICreateChargeTransaction';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import { getRepository, Repository, IsNull } from 'typeorm';
import Transaction, {
  EnumCategory,
  EnumStatus,
  EnumTransactionType,
} from '../entities/Transaction';

class TransactionsRepository implements ITransactionsRepository {
  private ormRepository: Repository<Transaction>;

  constructor() {
    this.ormRepository = getRepository(Transaction);
  }

  public async findBySyncId(sync_id: string): Promise<Transaction | undefined> {
    const transaction = await this.ormRepository.findOne({
      where: { sync_id },
      relations: ['touser', 'fromuser'],
    });

    return transaction;
  }

  public async findAll(user_id: string): Promise<Transaction[] | undefined> {
    return undefined;
  }

  public async findBalance(
    user_id: string,
    organization_id?: string,
  ): Promise<number> {
    const transaction = await this.ormRepository.findOne({
      where: [
        {
          organization_id,
          from_user_id: user_id,
          status: EnumStatus.Approved,
        },
        {
          organization_id,
          to_user_id: user_id,
          from_user_id: IsNull(),
          status: EnumStatus.Approved,
        },
      ],
      order: {
        created_at: 'DESC',
      },
    });
    if (transaction && transaction.balance) {
      return transaction.balance;
    }
    return 0;
  }

  public async findLatestTransactions(
    user_id: string,
    organization_id?: string,
  ): Promise<Transaction[] | undefined> {
    const transactions = await this.ormRepository.find({
      where: [
        {
          from_user_id: user_id,
          organization_id,
        },
        {
          organization_id,
          to_user_id: user_id,
          from_user_id: IsNull(),
        },
      ],
      order: {
        created_at: 'DESC',
      },
      take: 10,
      relations: ['touser', 'fromuser'],
    });

    return transactions.filter(
      t =>
        (t.transactionType === EnumTransactionType.Received &&
          t.status === EnumStatus.Approved) ||
        t.category === EnumCategory.Charge ||
        t.transactionType === EnumTransactionType.Sent,
    );
  }

  public async create(
    transactionData: ICreateTransactionDTO,
  ): Promise<Transaction> {
    const transaction = await this.ormRepository.create(transactionData);

    await this.ormRepository.save(transaction);

    return transaction;
  }

  public async save(transaction: Transaction): Promise<Transaction> {
    return await this.ormRepository.save(transaction);
  }

  public async createChargeTransaction(
    transactionData: ICreateChargeTransaction,
  ): Promise<Transaction> {
    const transaction = await this.ormRepository.create(transactionData);

    await this.ormRepository.save(transaction);

    return transaction;
  }
}

export default TransactionsRepository;
