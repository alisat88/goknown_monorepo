import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZtaHandoffTransactions1762000001000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE zta_handoff_transactions (
        hash varchar(64) PRIMARY KEY,
        state_hash varchar(64) NOT NULL,
        verifier_hash varchar(64) NOT NULL,
        client_id varchar(128) NOT NULL,
        redirect_uri varchar(2048) NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runner.query(
      'CREATE INDEX zta_handoff_transactions_expiry ON zta_handoff_transactions (expires_at)',
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE zta_handoff_transactions');
  }
}
