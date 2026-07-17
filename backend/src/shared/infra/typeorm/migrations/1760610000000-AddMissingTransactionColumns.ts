import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds columns that the Transaction entity expects but may be missing from
 * the production database if the original CreateTransactions migration was
 * never applied or was applied from an older version of the schema.
 *
 * Safe to run on a database that already has these columns — every statement
 * uses IF NOT EXISTS / exception-catching so it is fully idempotent.
 *
 * Columns addressed:
 *   - category        enum('transaction','charge')  — TypeORM SELECTs this on every find()
 *   - transactionType enum('sent','received')       — same
 *   - organization_id uuid nullable                 — added in a later migration; may be absent
 *
 * Enum fix:
 *   - status enum was created with typo 'unpproved'; adds the correct 'unapproved' value
 */
export class AddMissingTransactionColumns1760610000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Enum types ────────────────────────────────────────────────────────

    // categoryEnum  (named explicitly in CreateTransactions migration)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "categoryEnum" AS ENUM('transaction', 'charge');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // transactionType enum  (TypeORM auto-generates name: transactions_transactiontype_enum)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "transactions_transactiontype_enum" AS ENUM('sent', 'received');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ── 2. Fix status enum typo ('unpproved' → add 'unapproved') ─────────────
    // ALTER TYPE ... ADD VALUE IF NOT EXISTS is safe on PostgreSQL 9.3+
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "transactions_status_enum" ADD VALUE IF NOT EXISTS 'unapproved';
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `);

    // ── 3. Add missing columns ───────────────────────────────────────────────

    // category — nullable so existing rows are not rejected
    await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD COLUMN IF NOT EXISTS "category" "categoryEnum" NULL;
    `);

    // transactionType — nullable so existing rows are not rejected
    await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD COLUMN IF NOT EXISTS "transactionType" "transactions_transactiontype_enum" NULL;
    `);

    // organization_id — uuid, nullable (mirrors AddOrganizationIdTransactions migration)
    await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD COLUMN IF NOT EXISTS "organization_id" uuid NULL;
    `);

    // ── 4. Backfill existing rows ────────────────────────────────────────────
    // Old rows without a category are regular token transfers, not charges.
    await queryRunner.query(`
      UPDATE "transactions"
         SET "category" = 'transaction'
       WHERE "category" IS NULL;
    `);

    // Old rows without a transactionType: infer from from_user_id.
    // A charge (no from_user_id) is always a 'received' credit.
    // A transfer with a from_user_id is 'sent' from the sender's perspective;
    // the to_user_id row is 'received'. Since we can't split one row into two
    // here, default to 'sent' — the JS filter in the repo already handles
    // display-side semantics.
    await queryRunner.query(`
      UPDATE "transactions"
         SET "transactionType" = (
               CASE
                 WHEN "from_user_id" IS NULL THEN 'received'
                 ELSE 'sent'
               END
             )::"transactions_transactiontype_enum"
       WHERE "transactionType" IS NULL;
    `);

    // ── 5. Add FK for organization_id if the organizations table exists ──────
    const orgsExist = await queryRunner.query(`
      SELECT 1 FROM information_schema.tables
       WHERE table_name = 'organizations'
         AND table_schema = 'public'
       LIMIT 1;
    `);

    if (orgsExist.length > 0) {
      // Only add FK if it doesn't already exist
      const fkExists = await queryRunner.query(`
        SELECT 1 FROM information_schema.table_constraints
         WHERE constraint_name = 'TransactionsOrganizations_FK'
           AND table_name = 'transactions'
         LIMIT 1;
      `);
      if (fkExists.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "transactions"
            ADD CONSTRAINT "TransactionsOrganizations_FK"
            FOREIGN KEY ("organization_id")
            REFERENCES "organizations"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "TransactionsOrganizations_FK"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "organization_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "transactionType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "category"`,
    );
    // Do NOT drop the enum types — other migrations may depend on them.
    // Do NOT remove 'unapproved' from status enum — PostgreSQL doesn't support
    // removing enum values without recreating the type.
  }
}
