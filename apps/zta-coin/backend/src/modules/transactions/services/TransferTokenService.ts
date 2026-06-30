import { accountService } from '../../../shared/accounts/AccountService';
import { ledgerService } from '../../../shared/ledger/LedgerService';
import { hashService } from '../../../shared/hash/HashService';

interface IRequest {
  from_user: string;
  to_user: string;
  amount: number;
}

class TransferTokenService {
  public async execute({
    from_user,
    to_user,
    amount,
  }: IRequest): Promise<any> {

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Read persisted balances before the transfer
    const fromBalanceBefore = await accountService.getBalance(from_user);
    const toBalanceBefore = await accountService.getBalance(to_user);

    if (fromBalanceBefore < amount) {
      throw new Error('Insufficient balance');
    }

    // Persist balance changes in the accounts table
    await accountService.debit(from_user, amount);
    await accountService.credit(to_user, amount);

    // Read persisted balances after the transfer to record accurate snapshots
    const fromBalanceAfter = await accountService.getBalance(from_user);
    const toBalanceAfter = await accountService.getBalance(to_user);

    const timestamp = new Date().toISOString();
    const transactionType = 'KN-TEX-100';
    const transactionPayload = {
      type: transactionType,
      timestamp,
      from: from_user,
      to: to_user,
      amount,
      before: {
        from_balance: fromBalanceBefore,
        to_balance: toBalanceBefore,
      },
      after: {
        from_balance: fromBalanceAfter,
        to_balance: toBalanceAfter,
      },
    };
    const transactionId = hashService.hash(transactionPayload);

    await ledgerService.record({
      id: transactionId,
      type: transactionType,
      timestamp,
      from: from_user,
      to: to_user,
      amount,
      before: transactionPayload.before,
      after: transactionPayload.after,
    });

    return {
      transactionId,
      from_user,
      to_user,
      amount,
      from_balance: fromBalanceAfter,
      to_balance: toBalanceAfter,
      status: 'Completed',
      timestamp,
    };
  }
}

export default TransferTokenService;
