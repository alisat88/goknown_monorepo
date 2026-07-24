import { v4 as uuidv4 } from 'uuid';
import { EntityManager, getRepository, Repository } from 'typeorm';
import { Transaction } from '../../modules/transactions/infra/typeorm/entities/Transaction';
import {
  normalizeTokenAmount,
  tokenAmountToNumber,
} from '../amounts/TokenAmount';

class LedgerService {

  /**
   * ✅ Lazy repository initialization (CRITICAL FIX)
   */
  private getRepo(manager?: EntityManager): Repository<Transaction> {
    return manager ? manager.getRepository(Transaction) : getRepository(Transaction);
  }

  /**
   * 📝 Record a transaction
   */
  public async record(tx: any, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);

    const transaction = repo.create({
      id: tx.id || uuidv4(),
      type: tx.type,
      timestamp: new Date(tx.timestamp),
      from: tx.from,
      to: tx.to,
      amount: normalizeTokenAmount(tx.amount),
      before: tx.before,
      after: tx.after,
    });

    await repo.save(transaction);
  }

  /**
   * 📄 Get all transactions
   */
  public async getAll(): Promise<Transaction[]> {
    return this.getRepo().find({
      order: {
        timestamp: 'DESC',
      },
    });
  }

  /**
   * 🔍 Get transactions by account
   */
  public async getByAccount(accountId: string): Promise<Transaction[]> {
    return this.getRepo().find({
      where: [
        { from: accountId },
        { to: accountId },
      ],
      order: {
        timestamp: 'DESC',
      },
    });
  }

  /**
   * 📊 🚀 Velocity Tracking (KEY FEATURE)
   */
  public async getVelocity(accountId: string) {
    const repo = this.getRepo();

    const now = new Date();

    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const transactions = await repo.find({
      where: [
        { from: accountId },
        { to: accountId },
      ],
    });

    let last1minVolume = 0;
    let last5minVolume = 0;
    let last1hrVolume = 0;
    let txCountLast5min = 0;

    for (const tx of transactions) {
      const ts = new Date(tx.timestamp);

      if (ts >= oneHourAgo) {
        last1hrVolume += tokenAmountToNumber(tx.amount);
      }

      if (ts >= fiveMinutesAgo) {
        last5minVolume += tokenAmountToNumber(tx.amount);
        txCountLast5min++;
      }

      if (ts >= oneMinuteAgo) {
        last1minVolume += tokenAmountToNumber(tx.amount);
      }
    }

    /**
     * 🔥 Simple fraud detection flag (optional but impressive)
     */
    const isSuspicious =
      last1minVolume > 1000 || txCountLast5min > 10;

    return {
      accountId,
      last1minVolume,
      last5minVolume,
      last1hrVolume,
      txCountLast5min,
      isSuspicious,
    };
  }
}

export const ledgerService = new LedgerService();
