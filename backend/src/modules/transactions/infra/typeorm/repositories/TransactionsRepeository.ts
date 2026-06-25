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
    // When organization_id is undefined (personal wallet), omit the filter so we
    // match transactions regardless of whether organization_id is null or unset.
    const baseFilter = organization_id ? { organization_id } : {};
    const transaction = await this.ormRepository.findOne({
      where: [
        {
          ...baseFilter,
          from_user_id: user_id,
          status: EnumStatus.Approved,
        },
        {
          ...baseFilter,
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
      return Number(transaction.balance);
    }
    return 0;
  }

  public async findLatestTransactions(
    user_id: string,
    organization_id?: string,
  ): Promise<Transaction[] | undefined> {
    const baseFilter = organization_id ? { organization_id } : {};
    const transactions = await this.ormRepository.find({
      where: [
        {
          ...baseFilter,
          from_user_id: user_id,
        },
        {
          ...baseFilter,
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
