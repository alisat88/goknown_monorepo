import { getConnection } from 'typeorm';

import { HandoffStore } from './ZtaHandoffService';
import { digest } from './StrictSessionService';

const active = (user: any): boolean =>
  !!user && user.status === 'active' && !user.deleted_at && user.twoFactorAuthentication === true;

export class PostgresZtaHandoffStore implements HandoffStore {
  constructor(private connection = () => getConnection()) {}

  async issue(input: Parameters<HandoffStore['issue']>[0]): Promise<void> {
    await this.connection().transaction(async manager => {
      const users = await manager.query(
        'SELECT id, status, deleted_at, "twoFactorAuthentication" FROM users WHERE id = $1 FOR UPDATE',
        [input.userId],
      );
      const sessions = await manager.query(
        'SELECT user_id, expires_at, revoked_at FROM strict_login_sessions WHERE hash = $1 AND user_id = $2 FOR UPDATE',
        [input.parentSessionHash, input.userId],
      );
      const now = new Date();
      if (
        !active(users[0]) ||
        !sessions[0] ||
        sessions[0].revoked_at ||
        new Date(sessions[0].expires_at) <= now
      ) {
        throw new Error('Invalid strict parent session');
      }
      await manager.query(
        `INSERT INTO strict_zta_handoff_codes
          (hash, user_id, parent_session_hash, client_id, redirect_uri, state_hash,
           code_challenge, code_challenge_method, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'S256',$8)`,
        [
          input.codeHash,
          input.userId,
          input.parentSessionHash,
          input.clientId,
          input.redirectUri,
          input.stateHash,
          input.codeChallenge,
          input.expiresAt,
        ],
      );
    });
  }

  async redeem(input: Parameters<HandoffStore['redeem']>[0]) {
    return this.connection().transaction(async manager => {
      const found = await manager.query(
        'SELECT user_id FROM strict_zta_handoff_codes WHERE hash = $1',
        [input.codeHash],
      );
      if (!found[0]) return undefined;
      const users = await manager.query(
        'SELECT id, status, deleted_at, "twoFactorAuthentication" FROM users WHERE id = $1 FOR UPDATE',
        [found[0].user_id],
      );
      const handoff = await manager.query(
        'SELECT * FROM strict_zta_handoff_codes WHERE hash = $1 FOR UPDATE',
        [input.codeHash],
      );
      const row = handoff[0];
      const session = row
        ? await manager.query(
            'SELECT user_id, expires_at, revoked_at FROM strict_login_sessions WHERE hash = $1 AND user_id = $2 FOR UPDATE',
            [row.parent_session_hash, row.user_id],
          )
        : [];
      const now = input.now;
      if (
        !row ||
        row.consumed_at ||
        new Date(row.expires_at) <= now ||
        row.client_id !== input.clientId ||
        row.redirect_uri !== input.redirectUri ||
        !equal(row.state_hash, input.stateHash) ||
        !active(users[0]) ||
        !session[0] ||
        session[0].revoked_at ||
        new Date(session[0].expires_at) <= now ||
        !equal(row.code_challenge, digestVerifier(input.codeVerifier))
      ) {
        return undefined;
      }
      await manager.query(
        'UPDATE strict_zta_handoff_codes SET consumed_at = $2 WHERE hash = $1 AND consumed_at IS NULL',
        [input.codeHash, now],
      );
      return { userId: row.user_id, parentSessionHash: row.parent_session_hash };
    });
  }

  async parentValid(parentSessionHash: string, now: Date): Promise<boolean> {
    const rows = await this.connection().query(
      `SELECT s.expires_at, s.revoked_at, u.status, u.deleted_at, u."twoFactorAuthentication"
       FROM strict_login_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.hash = $1`,
      [parentSessionHash],
    );
    const row = rows[0];
    return !!row && !row.revoked_at && new Date(row.expires_at) > now && active(row);
  }
}

function digestVerifier(value: string): string {
  return require('crypto').createHash('sha256').update(value).digest('base64url');
}
function equal(left: string, right: string): boolean {
  return left === right;
}
