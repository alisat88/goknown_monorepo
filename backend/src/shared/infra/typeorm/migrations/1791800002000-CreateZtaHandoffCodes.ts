import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZtaHandoffCodes1791800002000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE strict_zta_handoff_codes (
        hash varchar(64) PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_session_hash varchar(64) NOT NULL REFERENCES strict_login_sessions(hash) ON DELETE CASCADE,
        client_id varchar(128) NOT NULL,
        redirect_uri varchar(2048) NOT NULL,
        state_hash varchar(64) NOT NULL,
        code_challenge varchar(128) NOT NULL,
        code_challenge_method varchar(8) NOT NULL CHECK (code_challenge_method = 'S256'),
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runner.query(
      'CREATE INDEX strict_zta_handoff_codes_expiry ON strict_zta_handoff_codes (expires_at)',
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE strict_zta_handoff_codes');
  }
}
