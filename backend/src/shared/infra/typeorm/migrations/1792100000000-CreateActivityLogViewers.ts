import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogViewers1792100000000
  implements MigrationInterface
{
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE activity_ledger.activity_log_viewers (
        user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        granted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
        granted_at timestamptz(3) NOT NULL DEFAULT clock_timestamp()
      );
      CREATE INDEX activity_log_viewers_granted_at ON activity_ledger.activity_log_viewers(granted_at DESC);
    `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'Activity Log access history is retained; revoke individual grants instead of dropping the table.',
    );
  }
}
