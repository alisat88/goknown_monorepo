import { accountService } from '../../../shared/accounts/AccountService';
import { ledgerService } from '../../../shared/ledger/LedgerService';
import { hashService } from '../../../shared/hash/HashService';
import { getConnection } from 'typeorm';
import {
  compareTokenAmounts,
  normalizeTokenAmount,
  tokenAmountToNumber,
} from '../../../shared/amounts/TokenAmount';

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

    const normalizedAmount = normalizeTokenAmount(amount);
    const apiAmount = tokenAmountToNumber(normalizedAmount);

    return getConnection().transaction(async manager => {
      const fromBeforeDecimal = await accountService.getBalanceDecimal(
        from_user,
        manager,
      );
      const toBeforeDecimal = await accountService.getBalanceDecimal(
        to_user,
        manager,
      );

      if (compareTokenAmounts(fromBeforeDecimal, normalizedAmount) < 0) {
        throw new Error('Insufficient balance');
      }

      await accountService.debit(from_user, normalizedAmount, manager);
      await accountService.credit(to_user, normalizedAmount, manager);

      const fromAfterDecimal = await accountService.getBalanceDecimal(
        from_user,
        manager,
      );
      const toAfterDecimal = await accountService.getBalanceDecimal(
        to_user,
        manager,
      );
      const fromBalanceBefore = tokenAmountToNumber(fromBeforeDecimal);
      const toBalanceBefore = tokenAmountToNumber(toBeforeDecimal);
      const fromBalanceAfter = tokenAmountToNumber(fromAfterDecimal);
      const toBalanceAfter = tokenAmountToNumber(toAfterDecimal);

      const timestamp = new Date().toISOString();
      const transactionType = 'KN-TEX-100';
      const transactionPayload = {
        type: transactionType,
        timestamp,
        from: from_user,
        to: to_user,
        amount: apiAmount,
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

      await ledgerService.record(
        {
          id: transactionId,
          type: transactionType,
          timestamp,
          from: from_user,
          to: to_user,
          amount: normalizedAmount,
          before: transactionPayload.before,
          after: transactionPayload.after,
        },
        manager,
      );

      return {
        transactionId,
        from_user,
        to_user,
        amount: apiAmount,
        from_balance: fromBalanceAfter,
        to_balance: toBalanceAfter,
        status: 'Completed',
        timestamp,
      };
    });
  }
}

export default TransferTokenService;
