import 'reflect-metadata';
import express from 'express';
import request from 'supertest';
import { getManager, getRepository } from 'typeorm';
import router from '../admin.routes';

jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  getManager: jest.fn(),
  getRepository: jest.fn(),
}));
jest.mock('@modules/users/infra/http/middlewares/ensureAuthenticated', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (
      ![
        'Bearer admin',
        'Bearer viewer',
        'Bearer member',
        'Bearer org-admin',
      ].includes(token)
    )
      return res.sendStatus(403);
    req.user = {
      sync_id:
        token === 'Bearer admin'
          ? 'admin-sync'
          : token === 'Bearer viewer'
          ? 'viewer-sync'
          : token === 'Bearer member'
          ? 'member-sync'
          : 'org-admin-sync',
    };
    return next();
  },
}));

const app = express();
app.use(express.json());
app.use('/admin/activity-log', router);
app.use((error: any, _req: any, res: any, _next: any) =>
  res.status(error.statusCode || 500).json({ message: error.message }),
);

beforeEach(() => {
  (getRepository as jest.Mock).mockReturnValue({
    findOne: jest.fn(({ where }: any) => {
      const users: Record<string, any> = {
        'admin-sync': { id: 'admin-id', role: 'admin' },
        'viewer-sync': { id: 'viewer-id', role: 'user' },
        'member-sync': { id: 'member-id', role: 'user' },
        'org-admin-sync': { id: 'org-admin-id', role: 'user' },
      };
      return Promise.resolve(users[where.sync_id]);
    }),
  });
  (getManager as jest.Mock).mockReturnValue({
    query: jest.fn((sql: string, params: any[] = []) => {
      if (sql.includes('activity_log_viewers')) {
        return Promise.resolve(
          sql.startsWith('SELECT') && params[0] === 'viewer-id'
            ? [{ '?column?': 1 }]
            : [],
        );
      }
      return Promise.resolve([
        {
          user_id: 'user-a',
          asset_id: 'asset-a',
          event_type: 'asset.access_heartbeat',
          recorded_at: '2026-01-01T00:00:00.000Z',
          estimated_active_ms: 15000,
          outcome: 'observed',
          total_count: 1,
        },
      ]);
    }),
  });
});

afterEach(() => jest.restoreAllMocks());

test('platform administrator is permitted', async () => {
  expect(
    (
      await request(app)
        .get('/admin/activity-log')
        .set('Authorization', 'Bearer admin')
    ).status,
  ).toBe(200);
});

test('explicit viewer is permitted without the admin role', async () => {
  expect(
    (
      await request(app)
        .get('/admin/activity-log')
        .set('Authorization', 'Bearer viewer')
    ).status,
  ).toBe(200);
});

test.each(['Bearer member', 'Bearer org-admin'])(
  'ordinary or organization-only users are denied: %s',
  async token => {
    if (token === 'Bearer org-admin') {
      (getRepository as jest.Mock).mockReturnValue({
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'org-admin-id', role: 'user' }),
      });
      (getManager as jest.Mock).mockReturnValue({
        query: jest.fn().mockResolvedValue([]),
      });
    }
    expect(
      (
        await request(app)
          .get('/admin/activity-log')
          .set('Authorization', token)
      ).status,
    ).toBe(403);
  },
);

test('revoked viewer is denied and only platform admins can manage grants', async () => {
  (getManager as jest.Mock).mockReturnValue({
    query: jest.fn().mockResolvedValue([]),
  });
  expect(
    (
      await request(app)
        .get('/admin/activity-log')
        .set('Authorization', 'Bearer viewer')
    ).status,
  ).toBe(403);
  expect(
    (
      await request(app)
        .post('/admin/activity-log/viewers/viewer-sync')
        .set('Authorization', 'Bearer viewer')
    ).status,
  ).toBe(403);
  expect(
    (
      await request(app)
        .post('/admin/activity-log/viewers/viewer-sync')
        .set('Authorization', 'Bearer admin')
    ).status,
  ).toBe(204);
});

test('returns a bounded read-only projection with filters and pagination', async () => {
  const response = await request(app)
    .get(
      '/admin/activity-log?from=2026-01-01T00:00:00.000Z&user=user-a&limit=10&offset=0',
    )
    .set('Authorization', 'Bearer admin');
  expect(response.status).toBe(200);
  expect(response.body.events[0]).toEqual({
    user_id: 'user-a',
    asset_id: 'asset-a',
    event_type: 'asset.access_heartbeat',
    recorded_at: '2026-01-01T00:00:00.000Z',
    estimated_active_ms: 15000,
    outcome: 'observed',
  });
  expect(response.body.page).toEqual({ limit: 10, offset: 0, total: 1 });
});

test('rejects unbounded or invalid filters', async () => {
  expect(
    (
      await request(app)
        .get('/admin/activity-log?limit=101')
        .set('Authorization', 'Bearer admin')
    ).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .get('/admin/activity-log?unknown=x')
        .set('Authorization', 'Bearer admin')
    ).status,
  ).toBe(400);
});
