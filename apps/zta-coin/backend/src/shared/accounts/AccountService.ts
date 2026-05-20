import { getRepository } from 'typeorm';
import { Account } from '../../modules/transactions/infra/typeorm/entities/Account';

class AccountService {

  private getRepo() {
    return getRepository(Account);
  }

  public async getBalance(accountId: string): Promise<number> {
    const repo = this.getRepo();

    const account = await repo.findOne({
      where: { id: accountId },
    });

    return account ? account.balance : 0;
  }

  public async credit(accountId: string, amount: number): Promise<void> {
    const repo = this.getRepo();

    let account = await repo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      account = repo.create({
        id: accountId,
        balance: amount,
      });
    } else {
      account.balance += amount;
    }

    await repo.save(account);
  }

  public async debit(accountId: string, amount: number): Promise<void> {
    const repo = this.getRepo();

    const account = await repo.findOne({
      where: { id: accountId },
    });

    if (!account || account.balance < amount) {
      throw new Error("Insufficient balance");
    }

    account.balance -= amount;

    await repo.save(account);
  }
}

export const accountService = new AccountService();