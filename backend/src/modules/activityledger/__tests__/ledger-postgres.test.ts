import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ActivityLedger, Identity } from '../ActivityLedger';
import { CreateActivityLedger1792000000000 } from '../../../shared/infra/typeorm/migrations/1792000000000-CreateActivityLedger';

// Fixed disposable socket/database ONLY. Never reads DATABASE_URL or app config.
const suite =
  process.env.RUN_ACTIVITY_LOCAL_PG === '1' ? describe : describe.skip;
suite('activity ledger on disposable PostgreSQL', () => {
  let owner: Connection;
  let runtime: Connection;
  let application: Connection;
  let ledger: ActivityLedger;
  const actor = uuid(),
    other = uuid(),
    asset = uuid(),
    asset2 = uuid();
  const authorize = jest.fn(
    async (user: string, resource: string): Promise<Identity> => {
      if (resource === 'missing')
        throw Object.assign(new Error('missing'), { statusCode: 404 });
      if (resource === 'private' && user !== actor)
        throw Object.assign(new Error('denied'), { statusCode: 403 });
      return {
        actor_user_id: user,
        actor_sync_id: user,
        asset_id: resource === 'second' ? asset2 : asset,
        asset_sync_id: resource,
      };
    },
  );
  beforeAll(async () => {
    const common: any = {
      type: 'postgres',
      host: '/private/tmp/dappgenius-ledger-pg-socket',
      port: 55447,
      database: 'activity_ledger_test',
      logging: false,
    };
    owner = await createConnection({
      ...common,
      name: 'activity-test-owner',
      username: 'ledger_test',
    });
    await owner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    const runner = owner.createQueryRunner();
    try {
      await new CreateActivityLedger1792000000000().up(runner);
    } finally {
      await runner.release();
    }
    await owner.query('CREATE ROLE activity_test_runtime LOGIN');
    await owner.query('CREATE ROLE activity_test_application LOGIN');
    await owner.query('GRANT CREATE ON SCHEMA public TO activity_test_application');
    await owner.query('GRANT USAGE ON SCHEMA activity_ledger TO activity_test_runtime');
    await owner.query(
      'GRANT SELECT, INSERT ON activity_ledger.activity_events TO activity_test_runtime',
    );
    await owner.query(
      'GRANT SELECT, INSERT, UPDATE ON activity_ledger.activity_access_sessions TO activity_test_runtime',
    );
    runtime = await createConnection({
      ...common,
      name: 'activity-test-runtime',
      username: 'activity_test_runtime',
    });
    application = await createConnection({
      ...common,
      name: 'activity-test-application',
      username: 'activity_test_application',
    });
    ledger = new ActivityLedger(runtime.manager, authorize, 'test-node');
  });
  afterAll(async () => {
    if (runtime) await runtime.close();
    if (application) await application.close();
    if (owner) {
      // Only this fixed disposable database; production down intentionally refuses.
      await owner.query(
      'REVOKE USAGE ON SCHEMA activity_ledger FROM activity_test_runtime; DROP SCHEMA IF EXISTS activity_ledger CASCADE; REASSIGN OWNED BY activity_test_runtime, activity_test_application TO ledger_test; DROP OWNED BY activity_test_runtime, activity_test_application; DROP ROLE IF EXISTS activity_test_runtime; DROP ROLE IF EXISTS activity_test_application',
      );
      await owner.close();
    }
  });
  const start = () => ledger.start(actor, 'public', uuid());
  test('restricted role can insert, with backend-resolved identities and DB timestamps', async () => {
    const event = await start();
    const [row] = await owner.query(
      'SELECT * FROM activity_ledger.activity_events WHERE id=$1',
      [event.id],
    );
    expect(row.actor_user_id).toBe(actor);
    expect(row.asset_id).toBe(asset);
    expect(row.recorded_at).toBeInstanceOf(Date);
    expect(row.metadata).toEqual({
      estimated_active_ms: 0,
      reason: 'ready',
      measurement: 'bounded_foreground_v1',
    });
  });
  test.each([
    'UPDATE activity_ledger.activity_events SET outcome=outcome',
    'DELETE FROM activity_ledger.activity_events',
    'TRUNCATE activity_ledger.activity_events',
    'ALTER TABLE activity_ledger.activity_events DISABLE TRIGGER ALL',
  ])('runtime rejects %s', async sql => {
    await expect(runtime.query(sql)).rejects.toMatchObject({ code: '42501' });
  });
  test('legacy application role cannot access the dedicated ledger schema', async () => {
    const [runtimeAcl] = await owner.query(
      `SELECT has_schema_privilege('activity_test_runtime','activity_ledger','USAGE') AS usage,
              has_schema_privilege('activity_test_runtime','activity_ledger','CREATE') AS can_create`,
    );
    expect(runtimeAcl.usage).toBe(true);
    expect(runtimeAcl.can_create).toBe(false);
    await expect(
      application.query('SELECT count(*) FROM activity_ledger.activity_events'),
    ).rejects.toMatchObject({ code: '42501' });
  });
  test.each([
    'UPDATE activity_ledger.activity_events SET outcome=outcome',
    'DELETE FROM activity_ledger.activity_events',
    'TRUNCATE activity_ledger.activity_events',
  ])(
    'trigger also rejects owner DML %s',
    async sql =>
      await expect(owner.query(sql)).rejects.toMatchObject({ code: '42501' }),
  );
  test('concurrent starts deduplicate, conflicting retry fails', async () => {
    const key = uuid();
    const events = await Promise.all([
      ledger.start(actor, 'public', key),
      new ActivityLedger(runtime.manager, authorize, 'second-node').start(
        actor,
        'public',
        key,
      ),
    ]);
    expect(events[0].id).toBe(events[1].id);
    await expect(ledger.start(actor, 'second', key)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
  test('ownership, missing and private assets reject', async () => {
    const event = await start();
    await expect(
      ledger.observe(other, 'public', event.access_session_id, 'heartbeat', {
        sequence: 1,
        elapsed_ms: 1,
        reason: 'heartbeat',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(ledger.start(actor, 'missing', uuid())).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(ledger.start(other, 'private', uuid())).rejects.toMatchObject({
      statusCode: 403,
    });
  });
  test('rechecks authorization on mutations and even on exact retries', async () => {
    const event = await start();
    authorize.mockRejectedValueOnce(
      Object.assign(new Error('revoked'), { statusCode: 403 }),
    );
    await expect(
      ledger.observe(actor, 'public', event.access_session_id, 'heartbeat', {
        sequence: 1,
        elapsed_ms: 1,
        reason: 'heartbeat',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  test('concurrent heartbeat retries append once; conflicts and reordering fail', async () => {
    const event = await start();
    const body = { sequence: 1, elapsed_ms: 100, reason: 'heartbeat' };
    const results = await Promise.all([
      ledger.observe(
        actor,
        'public',
        event.access_session_id,
        'heartbeat',
        body,
      ),
      ledger.observe(
        actor,
        'public',
        event.access_session_id,
        'heartbeat',
        body,
      ),
    ]);
    expect(results[0].id).toBe(results[1].id);
    await expect(
      ledger.observe(actor, 'public', event.access_session_id, 'heartbeat', {
        ...body,
        elapsed_ms: 99,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      ledger.observe(actor, 'public', event.access_session_id, 'heartbeat', {
        ...body,
        sequence: 3,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test('concurrent ends append once; late heartbeats fail', async () => {
    const event = await start();
    const body = { sequence: 1, elapsed_ms: 1, reason: 'navigation' };
    const ends = await Promise.all([
      ledger.observe(actor, 'public', event.access_session_id, 'end', body),
      ledger.observe(actor, 'public', event.access_session_id, 'end', body),
    ]);
    expect(ends[0].id).toBe(ends[1].id);
    await expect(
      ledger.observe(actor, 'public', event.access_session_id, 'heartbeat', {
        ...body,
        sequence: 2,
        reason: 'heartbeat',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test.each(['offline', 'idle', 'sleep', 'error', 'hidden', 'pagehide'])(
    'nonzero %s observation receives zero credit', async reason => {
      const event = await start();
      const result = await ledger.observe(
        actor,
        'public',
        event.access_session_id,
        'end',
        { sequence: 1, elapsed_ms: 15000, reason },
      );
      expect(result.metadata.estimated_active_ms).toBe(0);
    },
  );
  test('stale session becomes incomplete with zero tail even when mutation fails', async () => {
    const event = await start();
    await owner.query(
      "UPDATE activity_ledger.activity_access_sessions SET last_observed_at=clock_timestamp()-interval '46 seconds' WHERE id=$1",
      [event.access_session_id],
    );
    await expect(
      ledger.observe(actor, 'public', event.access_session_id, 'heartbeat', {
        sequence: 1,
        elapsed_ms: 15000,
        reason: 'heartbeat',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    const events = await owner.query(
      "SELECT * FROM activity_ledger.activity_events WHERE access_session_id=$1 AND event_type='asset.access_ended'",
      [event.access_session_id],
    );
    expect(events).toHaveLength(0);
  });
  test('read-only history represents stale sessions without writing timeout events', async () => {
    const event = await start();
    await owner.query(
      "UPDATE activity_ledger.activity_access_sessions SET last_observed_at=clock_timestamp()-interval '46 seconds' WHERE id=$1",
      [event.access_session_id],
    );
    const before = await owner.query(
      'SELECT count(*)::int AS count FROM activity_ledger.activity_events',
    );
    const first = await ledger.list(actor, 2);
    const second = await ledger.list(actor, 2);
    const after = await owner.query(
      'SELECT count(*)::int AS count FROM activity_ledger.activity_events',
    );
    expect(after[0].count).toBe(before[0].count);
    expect(first.incomplete_sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          access_session_id: event.access_session_id,
          outcome: 'incomplete',
          estimated_active_ms: 0,
        }),
      ]),
    );
    expect(second.incomplete_sessions).toHaveLength(
      first.incomplete_sessions.length,
    );
    expect(first.events[0].request_fingerprint).toBeUndefined();
  });
  test('pagination remains stable while stale sessions are represented', async () => {
    await start();
    const first = await ledger.list(actor, 1);
    const next = await ledger.list(actor, 1, {
      at: first.events[0].recorded_at.toISOString(),
      id: first.events[0].id,
    });
    expect(
      [...first.events, ...next.events].every(
        row => row.actor_user_id === actor,
      ),
    ).toBe(true);
    expect(
      new Set(first.events.map(row => row.id)).size +
        new Set(next.events.map(row => row.id)).size,
    ).toBe(new Set([...first.events, ...next.events].map(row => row.id)).size);
    expect(first.incomplete_sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ outcome: 'incomplete' }),
      ]),
    );
  });
  test('DB rejects sensitive metadata even through a direct insert', async () => {
    const event = await start();
    await expect(
      runtime.query(
        `INSERT INTO activity_ledger.activity_events (event_type, actor_user_id, actor_sync_id, asset_id, asset_sync_id,
      source_node, access_session_id, correlation_id, sequence, outcome, request_fingerprint, metadata)
      SELECT event_type, actor_user_id, actor_sync_id, asset_id, asset_sync_id, source_node, uuid_generate_v4(), correlation_id,
      sequence, outcome, request_fingerprint, metadata || '{"url":"forbidden"}'::jsonb FROM activity_ledger.activity_events WHERE id=$1`,
        [event.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
  test('failed event insert rolls back projection and rejects without fake success', async () => {
    await owner.query(
      'REVOKE INSERT ON activity_ledger.activity_events FROM activity_test_runtime',
    );
    const key = uuid();
    try {
      await expect(ledger.start(actor, 'public', key)).rejects.toMatchObject({
        code: '42501',
      });
    } finally {
      await owner.query(
        'GRANT INSERT ON activity_ledger.activity_events TO activity_test_runtime',
      );
    }
    expect(
      await owner.query(
        'SELECT id FROM activity_ledger.activity_access_sessions WHERE request_id=$1',
        [key],
      ),
    ).toHaveLength(0);
  });
});
