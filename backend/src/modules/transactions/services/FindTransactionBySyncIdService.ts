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
