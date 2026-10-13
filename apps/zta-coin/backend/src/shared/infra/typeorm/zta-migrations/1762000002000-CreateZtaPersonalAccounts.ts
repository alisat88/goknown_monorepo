import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZtaPersonalAccounts1762000002000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE zta_personal_accounts (
        account_id varchar(64) PRIMARY KEY,
        dapp_user_id uuid NOT NULL UNIQUE,
        balance numeric(30,8) NOT NULL DEFAULT 0.00000000,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE zta_personal_accounts');
  }
}
