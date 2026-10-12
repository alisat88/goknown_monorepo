import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZtaAuthSessions1762000000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE zta_auth_sessions (
        hash varchar(64) PRIMARY KEY,
        dapp_user_id uuid NOT NULL,
        parent_session_hash varchar(64) NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runner.query(
      'CREATE INDEX zta_auth_sessions_expiry ON zta_auth_sessions (expires_at)',
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE zta_auth_sessions');
  }
}
