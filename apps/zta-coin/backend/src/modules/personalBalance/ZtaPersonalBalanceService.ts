import { getDatabaseConnection } from '@shared/infra/typeorm';

export interface PersonalBalanceStore {
  getOrCreate(userId: string): Promise<{ accountId: string; balance: string }>;
}

function exactBalance(value: unknown): string {
  const raw = String(value);
  if (!/^\d+(?:\.\d+)?$/.test(raw)) throw new Error('Invalid stored balance');
  const [whole, fraction = ''] = raw.split('.');
  if (fraction.length > 8) throw new Error('Invalid stored balance precision');
  return `${whole}.${fraction.padEnd(8, '0')}`;
}

export class PostgresPersonalBalanceStore implements PersonalBalanceStore {
  constructor(private connectionProvider = getDatabaseConnection) {}

  async getOrCreate(userId: string): Promise<{ accountId: string; balance: string }> {
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error('Invalid authenticated identity');
    const connection = this.connectionProvider();
    if (!connection) throw new Error('ZTA database is unavailable');
    const accountId = `personal:${userId}`;
    return connection.transaction(async manager => {
      await manager.query(
        `INSERT INTO zta_personal_accounts (account_id, dapp_user_id, balance)
         VALUES ($1, $2, CAST('0.00000000' AS numeric(30,8)))
         ON CONFLICT DO NOTHING`,
        [accountId, userId],
      );
      const rows = await manager.query(
        `SELECT account_id, balance FROM zta_personal_accounts WHERE dapp_user_id = $1`,
        [userId],
      );
      if (!rows[0]) throw new Error('Personal account unavailable');
      return { accountId: rows[0].account_id, balance: exactBalance(rows[0].balance) };
    });
  }
}

export class ZtaPersonalBalanceService {
  constructor(private store: PersonalBalanceStore) {}

  getBalance(userId: string) {
    return this.store.getOrCreate(userId);
  }
}
