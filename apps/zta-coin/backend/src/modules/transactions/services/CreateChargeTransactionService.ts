import { inject, injectable } from 'tsyringe';

import Transaction, {
  EnumCategory,
  EnumStatus,
  EnumTransactionType,
} from '../infra/typeorm/entities/Transaction';
import ITransactionsRepository from '../repositories/ITransactionsRepository';
import IChargesRepository from '@modules/charges/repositories/IChargesRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  amount: number;
  charge_id: string;
  to_user_id: string;
  organization_id?: string | null;
  sync_id?: string;
}

@injectable()
class CreateChargeTransactionService {
  constructor(
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('ChargesRepository')
    private chargesRepository: IChargesRepository,
  ) {}

  public async execute({
    to_user_id,
    amount,
    charge_id,
    organization_id,
    sync_id,
  }: IRequest): Promise<Transaction> {
    const charge = await this.chargesRepository.findById(charge_id);

    if (!charge) {
      throw new AppError('Charge not exists');
    }

    if (charge.user_id !== to_user_id) {
      throw new AppError('This charge does not belong to that user');
    }

    const currentBalance = await this.transactionsRepository.findBalance(
      to_user_id,
      organization_id,
    );

    const newBalance = Number(currentBalance) + Number(amount);
    const transaction =
      await this.transactionsRepository.createChargeTransaction({
        amount,
        balance: newBalance,
        to_user_id,
        charge_id,
        organization_id,
        category: EnumCategory.Charge,
        status: EnumStatus.Approved,
        transactionType: EnumTransactionType.Received,
        sync_id,
      });

    return transaction;
  }
}

export default CreateChargeTransactionService;
