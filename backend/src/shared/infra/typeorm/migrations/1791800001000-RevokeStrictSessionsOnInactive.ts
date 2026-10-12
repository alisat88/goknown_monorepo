import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Keep strict authentication revoked across an inactive -> active transition.
 * The trigger runs in the same transaction as the legacy users update, so a
 * rolled-back status change also rolls back its session revocations.
 */
export class RevokeStrictSessionsOnInactive1791800001000
  implements MigrationInterface
{
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE OR REPLACE FUNCTION revoke_strict_sessions_on_inactive()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF OLD.status::text IS DISTINCT FROM NEW.status::text
           AND NEW.status::text = 'inactive' THEN
          UPDATE strict_login_sessions
             SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
           WHERE user_id = NEW.id
             AND revoked_at IS NULL;
        END IF;
        RETURN NEW;
      END;
      $$;
    `);
    await runner.query(`
      CREATE TRIGGER revoke_strict_sessions_on_user_inactive
      AFTER UPDATE OF status ON users
      FOR EACH ROW
      EXECUTE FUNCTION revoke_strict_sessions_on_inactive();
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      'DROP TRIGGER IF EXISTS revoke_strict_sessions_on_user_inactive ON users',
    );
    await runner.query(
      'DROP FUNCTION IF EXISTS revoke_strict_sessions_on_inactive()',
    );
  }
}
