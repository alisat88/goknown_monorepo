import { getDatabaseConnection } from '@shared/infra/typeorm';

export interface ZtaSessionRecord {
  hash: string;
  dapp_user_id: string;
  parent_session_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface ZtaHandoffTransaction {
  hash: string;
  state_hash: string;
  verifier_hash: string;
  client_id: string;
  redirect_uri: string;
  expires_at: Date;
}

export class ZtaAuthSessionStore {
  constructor(private connectionProvider = getDatabaseConnection) {}

  private connection() {
    const connection = this.connectionProvider();
    if (!connection) throw new Error('ZTA database is unavailable');
    return connection;
  }

  async create(record: ZtaSessionRecord): Promise<void> {
    await this.connection().query(
      `INSERT INTO zta_auth_sessions
        (hash, dapp_user_id, parent_session_hash, expires_at, revoked_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        record.hash,
        record.dapp_user_id,
        record.parent_session_hash,
        record.expires_at,
        record.revoked_at,
      ],
    );
  }

  async findActive(hash: string, now = new Date()): Promise<ZtaSessionRecord | undefined> {
    const rows = await this.connection().query(
      `SELECT hash, dapp_user_id, parent_session_hash, expires_at, revoked_at
       FROM zta_auth_sessions
       WHERE hash = $1 AND revoked_at IS NULL AND expires_at > $2`,
      [hash, now],
    );
    return rows[0];
  }

  async revoke(hash: string, now = new Date()): Promise<void> {
    await this.connection().query(
      'UPDATE zta_auth_sessions SET revoked_at = COALESCE(revoked_at, $2) WHERE hash = $1',
      [hash, now],
    );
  }

  async createTransaction(value: ZtaHandoffTransaction): Promise<void> {
    await this.connection().query(
      `INSERT INTO zta_handoff_transactions
        (hash, state_hash, verifier_hash, client_id, redirect_uri, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [value.hash, value.state_hash, value.verifier_hash, value.client_id, value.redirect_uri, value.expires_at],
    );
  }

  async consumeTransaction(input: {
    hash: string;
    stateHash: string;
    verifierHash: string;
    clientId: string;
    redirectUri: string;
    now: Date;
  }): Promise<boolean> {
    return this.connection().transaction(async manager => {
      const rows = await manager.query(
        'SELECT * FROM zta_handoff_transactions WHERE hash = $1 FOR UPDATE',
        [input.hash],
      );
      const row = rows[0];
      if (
        !row ||
        row.consumed_at ||
        new Date(row.expires_at) <= input.now ||
        row.state_hash !== input.stateHash ||
        row.verifier_hash !== input.verifierHash ||
        row.client_id !== input.clientId ||
        row.redirect_uri !== input.redirectUri
      ) return false;
      await manager.query(
        'UPDATE zta_handoff_transactions SET consumed_at = $2 WHERE hash = $1 AND consumed_at IS NULL',
        [input.hash, input.now],
      );
      return true;
    });
  }
}
