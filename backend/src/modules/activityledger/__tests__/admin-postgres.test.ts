import 'reflect-metadata';
import express from 'express';
import request from 'supertest';
import {
  Connection,
  createConnection,
  getManager,
  getRepository,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import router from '../admin.routes';
import { CreateActivityLedger1792000000000 } from '../../../shared/infra/typeorm/migrations/1792000000000-CreateActivityLedger';
import { CreateActivityLogViewers1792100000000 } from '../../../shared/infra/typeorm/migrations/1792100000000-CreateActivityLogViewers';

const suite =
  process.env.RUN_ACTIVITY_ADMIN_LOCAL_PG === '1' ? describe : describe.skip;

jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  getManager: jest.fn(),
  getRepository: jest.fn(),
}));
jest.mock('@modules/users/infra/http/middlewares/ensureAuthenticated', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (token === 'Bearer admin') {
      req.user = { sync_id: 'admin-sync' };
      return next();
    }
    if (token === 'Bearer viewer') {
      req.user = { sync_id: 'viewer-sync' };
      return next();
    }
    if (token === 'Bearer member') {
      req.user = { sync_id: 'member-sync' };
      return next();
    }
    return res.sendStatus(403);
  },
}));

suite('administrator activity log on disposable PostgreSQL', () => {
  let connection: Connection;
  const app = express();

  beforeAll(async () => {
    connection = await createConnection({
      name: 'activity-admin-test',
      type: 'postgres',
      host: '/private/tmp/dappgenius-ledger-pg-socket',
      port: 55447,
      database: 'activity_ledger_test',
      username: 'ledger_test',
      logging: false,
    });
    await connection.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await connection.query(
      'CREATE TABLE users (id uuid PRIMARY KEY, sync_id text UNIQUE, role text NOT NULL)',
    );
    const runner = connection.createQueryRunner();
    try {
      await new CreateActivityLedger1792000000000().up(runner);
    } finally {
      await runner.release();
    }
    const permissionRunner = connection.createQueryRunner();
    try {
      await new CreateActivityLogViewers1792100000000().up(permissionRunner);
    } finally {
      await permissionRunner.release();
    }
    const viewerId = uuid();
    await connection.query(
      'INSERT INTO users (id, sync_id, role) VALUES ($1, $2, $3), ($4, $5, $6)',
      [uuid(), 'admin-sync', 'admin', viewerId, 'viewer-sync', 'user'],
    );
    await connection.query(
      'INSERT INTO activity_log_viewers (user_id) VALUES ($1)',
      [viewerId],
    );
    const session = uuid();
    await connection.query(
      `INSERT INTO activity_access_sessions
       (id, request_id, actor_user_id, actor_sync_id, asset_id, asset_sync_id, source_node)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        session,
        uuid(),
        uuid(),
        'synthetic-user',
        uuid(),
        'synthetic-asset',
        'test-node',
      ],
    );
    for (const [type, at, duration] of [
      ['asset.access_started', '2026-01-01T00:00:00.000Z', 0],
      ['asset.access_heartbeat', '2026-01-01T00:00:10.000Z', 10000],
      ['asset.access_ended', '2026-01-02T00:00:00.000Z', 0],
    ] as const) {
      await connection.query(
        `INSERT INTO activity_events
         (access_session_id, correlation_id, actor_user_id, actor_sync_id, asset_id, asset_sync_id,
          source_node, event_type, sequence, outcome, request_fingerprint, metadata, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)`,
        [
          session,
          uuid(),
          uuid(),
          'synthetic-user',
          uuid(),
          'synthetic-asset',
          'test-node',
          type,
          type === 'asset.access_started'
            ? 0
            : type === 'asset.access_heartbeat'
            ? 1
            : 2,
          type === 'asset.access_ended' ? 'incomplete' : 'observed',
          'f'.repeat(64),
          JSON.stringify({
            estimated_active_ms: duration,
            reason:
              type === 'asset.access_started'
                ? 'ready'
                : type === 'asset.access_ended'
                ? 'timeout'
                : 'heartbeat',
            measurement: 'bounded_foreground_v1',
          }),
          at,
        ],
      );
    }
    (getManager as jest.Mock).mockReturnValue(connection.manager);
    (getRepository as jest.Mock).mockReturnValue({
      findOne: jest.fn(({ where }: any) =>
        connection
          .query('SELECT id, sync_id, role FROM users WHERE sync_id=$1', [
            where.sync_id,
          ])
          .then(rows => rows[0]),
      ),
    });
    app.use(express.json());
    app.use('/admin/activity-log', router);
  });

  afterAll(async () => {
    if (connection) {
      await connection.query(
        'DROP TABLE IF EXISTS activity_log_viewers, activity_events, activity_access_sessions, users CASCADE',
      );
      await connection.query(
        'DROP FUNCTION IF EXISTS reject_activity_event_mutation()',
      );
      await connection.close();
    }
  });

  test('returns stored events, metadata duration, filters, pagination, and empty pages', async () => {
    const first = await request(app)
      .get('/admin/activity-log?limit=2&offset=0')
      .set('Authorization', 'Bearer admin');
    expect(first.status).toBe(200);
    expect(first.body.events).toHaveLength(2);
    expect(first.body.page.total).toBe(3);
    expect(first.body.events[0]).toMatchObject({
      user_id: 'synthetic-user',
      asset_id: 'synthetic-asset',
    });
    expect(first.body.events[0].estimated_active_ms).toBe(0);

    const filtered = await request(app)
      .get(
        '/admin/activity-log?user=synthetic-user&asset=synthetic-asset&from=2026-01-01T00:00:00.000Z&to=2026-01-01T23:59:59.999Z',
      )
      .set('Authorization', 'Bearer admin');
    expect(filtered.status).toBe(200);
    expect(filtered.body.events).toHaveLength(2);
    expect(
      (
        await request(app)
          .get('/admin/activity-log?user=missing')
          .set('Authorization', 'Bearer admin')
      ).body.events,
    ).toEqual([]);
    expect(
      (
        await request(app)
          .get('/admin/activity-log?limit=1')
          .set('Authorization', 'Bearer viewer')
      ).status,
    ).toBe(200);
  });

  test('rejects non-admins and preserves append-only events', async () => {
    expect(
      (
        await request(app)
          .get('/admin/activity-log')
          .set('Authorization', 'Bearer member')
      ).status,
    ).toBe(403);
    await expect(
      connection.query("UPDATE activity_events SET outcome='observed'"),
    ).rejects.toMatchObject({ code: '42501' });
    const [{ count }] = await connection.query(
      'SELECT count(*)::int AS count FROM activity_events',
    );
    expect(count).toBe(3);
  });
});
