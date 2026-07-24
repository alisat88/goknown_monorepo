import { EntityManager, getRepository, Repository } from 'typeorm';
import { Account } from '../../modules/transactions/infra/typeorm/entities/Account';
import {
  addTokenAmounts,
  compareTokenAmounts,
  normalizeTokenAmount,
  subtractTokenAmounts,
  tokenAmountToNumber,
} from '../amounts/TokenAmount';

class AccountService {

  private getRepo(manager?: EntityManager): Repository<Account> {
    return manager ? manager.getRepository(Account) : getRepository(Account);
  }

  public async getBalanceDecimal(
    accountId: string,
    manager?: EntityManager,
  ): Promise<string> {
    const repo = this.getRepo(manager);

    const account = await repo.findOne({
      where: { id: accountId },
    });

    return account ? account.balance : '0.00000000';
  }

  public async getBalance(
    accountId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return tokenAmountToNumber(await this.getBalanceDecimal(accountId, manager));
  }

  public async credit(
    accountId: string,
    amount: number | string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);
    const normalizedAmount = normalizeTokenAmount(amount);

    let account = await repo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      account = repo.create({
        id: accountId,
        balance: normalizedAmount,
      });
    } else {
      account.balance = addTokenAmounts(account.balance, normalizedAmount);
    }

    await repo.save(account);
  }

  public async debit(
    accountId: string,
    amount: number | string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);
    const normalizedAmount = normalizeTokenAmount(amount);

    const account = await repo.findOne({
      where: { id: accountId },
    });

    if (!account || compareTokenAmounts(account.balance, normalizedAmount) < 0) {
      throw new Error("Insufficient balance");
    }

    account.balance = subtractTokenAmounts(account.balance, normalizedAmount);

    await repo.save(account);
  }
}

export const accountService = new AccountService();
