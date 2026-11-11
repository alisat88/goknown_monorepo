import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLedger1792000000000 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    // uuid-ossp is already required by the parent schema. No historical FKs:
    // deleting a user or asset must never mutate retained event identity.
    await runner.query(`
      CREATE TABLE activity_access_sessions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        request_id uuid NOT NULL,
        actor_user_id uuid NOT NULL,
        actor_sync_id text NOT NULL,
        asset_id uuid NOT NULL,
        asset_sync_id text NOT NULL,
        source_node varchar(64) NOT NULL,
        last_sequence integer NOT NULL DEFAULT 0,
        last_observed_at timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
        ended boolean NOT NULL DEFAULT false,
        UNIQUE(actor_user_id, request_id)
      );
      CREATE INDEX activity_sessions_expiry ON activity_access_sessions(actor_user_id, last_observed_at) WHERE NOT ended;
      CREATE TABLE activity_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        schema_version smallint NOT NULL DEFAULT 1 CHECK (schema_version = 1),
        event_type text NOT NULL CHECK (event_type IN ('asset.access_started', 'asset.access_heartbeat', 'asset.access_ended')),
        recorded_at timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
        actor_user_id uuid NOT NULL,
        actor_sync_id text NOT NULL,
        asset_id uuid NOT NULL,
        asset_sync_id text NOT NULL,
        source_node varchar(64) NOT NULL,
        access_session_id uuid NOT NULL,
        correlation_id uuid NOT NULL,
        sequence integer NOT NULL CHECK (sequence >= 0),
        outcome text NOT NULL CHECK (outcome IN ('observed', 'incomplete')),
        request_fingerprint varchar(64) NOT NULL,
        metadata jsonb NOT NULL CHECK (
          jsonb_typeof(metadata) = 'object' AND octet_length(metadata::text) <= 512
          AND metadata - ARRAY['estimated_active_ms','reason','measurement']::text[] = '{}'::jsonb
          AND metadata ?& ARRAY['estimated_active_ms','reason','measurement']
          AND jsonb_typeof(metadata->'estimated_active_ms') = 'number'
          AND (metadata->>'estimated_active_ms')::numeric BETWEEN 0 AND 20000
          AND jsonb_typeof(metadata->'reason') = 'string'
          AND jsonb_typeof(metadata->'measurement') = 'string'
          AND metadata->>'measurement' = 'bounded_foreground_v1'
          AND metadata->>'reason' IN ('ready','heartbeat','hidden','offline','idle','navigation','pagehide','error','timeout','sleep')
        ),
        UNIQUE(access_session_id, sequence)
      );
      CREATE INDEX activity_events_actor_time ON activity_events(actor_user_id, recorded_at DESC, id DESC);
      CREATE INDEX activity_events_asset_time ON activity_events(asset_id, recorded_at DESC);
      CREATE UNIQUE INDEX activity_events_one_end ON activity_events(access_session_id) WHERE event_type = 'asset.access_ended';
      CREATE FUNCTION reject_activity_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'activity_events is append-only' USING ERRCODE = '42501';
      END; $$;
      CREATE TRIGGER activity_events_no_mutation BEFORE UPDATE OR DELETE OR TRUNCATE ON activity_events
        FOR EACH STATEMENT EXECUTE FUNCTION reject_activity_event_mutation();
    `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'Activity history is retained: disable capture to roll back; destructive migration rollback is prohibited.',
    );
  }
}
