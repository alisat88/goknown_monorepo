import { getConnection } from 'typeorm';
import {
  StrictStore,
  LockedStore,
  Identity,
  Challenge,
  Session,
} from './StrictSessionService';

// All writers lock the canonical users row first, including verification and
// logout. This serializes competing requests across backend processes.
export class PostgresStrictStore implements StrictStore {
  constructor(private connection = () => getConnection()) {}
  async admitPasswordAttempt(key: string): Promise<boolean> {
    const rows = await this.connection().query(
      `INSERT INTO strict_login_throttles (key, attempts, expires_at)
      VALUES ($1, 1, clock_timestamp() + interval '15 minutes') ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN strict_login_throttles.expires_at <= clock_timestamp() THEN 1 ELSE LEAST(strict_login_throttles.attempts + 1, 11) END,
      expires_at = CASE WHEN strict_login_throttles.expires_at <= clock_timestamp() THEN clock_timestamp() + interval '15 minutes' ELSE strict_login_throttles.expires_at END
      RETURNING attempts`,
      [key],
    );
    return rows[0].attempts <= 10;
  }
  findUsers(email: string): Promise<Identity[]> {
    return this.connection().query(
      'SELECT id, email, password, status, deleted_at, "twoFactorAuthentication" FROM users WHERE lower(trim(email)) = $1 LIMIT 2',
      [email],
    );
  }
  async owner(
    kind: 'challenge' | 'session',
    hash: string,
  ): Promise<string | undefined> {
    const table =
      kind === 'challenge'
        ? 'strict_login_challenges'
        : 'strict_login_sessions';
    const rows = await this.connection().query(
      `SELECT user_id FROM ${table} WHERE hash = $1`,
      [hash],
    );
    return rows[0]?.user_id;
  }
  locked<T>(
    userId: string,
    work: (store: LockedStore) => Promise<T>,
  ): Promise<T> {
    return this.connection().transaction(async manager => {
      const users = await manager.query(
        'SELECT id, email, password, status, deleted_at, "twoFactorAuthentication" FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      );
      const [{ now }] = await manager.query('SELECT clock_timestamp() AS now');
      const one = async (sql: string, parameters: unknown[]) =>
        (await manager.query(sql, parameters))[0];
      return work({
        user: users[0],
        now,
        latestChallenge: () =>
          one(
            'SELECT * FROM strict_login_challenges WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId],
          ),
        challenge: hash =>
          one(
            'SELECT * FROM strict_login_challenges WHERE hash = $1 AND user_id = $2',
            [hash, userId],
          ),
        invalidateChallenges: async () => {
          await manager.query(
            'UPDATE strict_login_challenges SET consumed_at = $2 WHERE user_id = $1 AND consumed_at IS NULL',
            [userId, now],
          );
        },
        saveChallenge: async (c: Challenge) => {
          if (c.user_id !== userId) throw new Error('Strict identity mismatch');
          await manager.query(
            `INSERT INTO strict_login_challenges (hash, user_id, code_hash, salt, credential_hash, expires_at, attempts, consumed_at, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (hash) DO UPDATE SET attempts=EXCLUDED.attempts, consumed_at=EXCLUDED.consumed_at`,
            [
              c.hash,
              c.user_id,
              c.code_hash,
              c.salt,
              c.credential_hash,
              c.expires_at,
              c.attempts,
              c.consumed_at,
              c.created_at,
            ],
          );
        },
        session: hash =>
          one(
            'SELECT * FROM strict_login_sessions WHERE hash = $1 AND user_id = $2',
            [hash, userId],
          ),
        saveSession: async (s: Session) => {
          if (s.user_id !== userId) throw new Error('Strict identity mismatch');
          await manager.query(
            `INSERT INTO strict_login_sessions (hash,user_id,credential_hash,expires_at,revoked_at)
            VALUES ($1,$2,$3,$4,$5) ON CONFLICT (hash) DO UPDATE SET revoked_at=EXCLUDED.revoked_at`,
            [s.hash, s.user_id, s.credential_hash, s.expires_at, s.revoked_at],
          );
        },
      });
    });
  }
}
