import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateStrictLoginFoundation1791800000000
  implements MigrationInterface
{
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE strict_login_throttles (
      key varchar(64) PRIMARY KEY, attempts integer NOT NULL CHECK (attempts BETWEEN 1 AND 11), expires_at timestamptz NOT NULL)`);
    await runner.query(
      'CREATE INDEX strict_login_throttles_expiry ON strict_login_throttles (expires_at)',
    );
    await runner.query(`CREATE TABLE strict_login_challenges (
      hash varchar(64) PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash varchar(64) NOT NULL, salt varchar(32) NOT NULL, credential_hash varchar(64) NOT NULL,
      expires_at timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
      consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await runner.query(
      'CREATE INDEX strict_login_challenges_user_created ON strict_login_challenges (user_id, created_at DESC)',
    );
    await runner.query(`CREATE TABLE strict_login_sessions (
      hash varchar(64) PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      credential_hash varchar(64) NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz)`);
    await runner.query(
      'CREATE INDEX strict_login_sessions_user ON strict_login_sessions (user_id)',
    );
    await runner.query(
      'CREATE INDEX strict_login_sessions_expiry ON strict_login_sessions (expires_at)',
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE strict_login_sessions');
    await runner.query('DROP TABLE strict_login_challenges');
    await runner.query('DROP TABLE strict_login_throttles');
  }
}
