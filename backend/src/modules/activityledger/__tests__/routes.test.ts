import 'reflect-metadata';
import express from 'express';
import request from 'supertest';
import { container } from 'tsyringe';
import { getRepository } from 'typeorm';
import router, { authorizePreview } from '../activity.routes';
import { ActivityLedger } from '../ActivityLedger';
import AppError from '@shared/errors/AppError';

jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  getManager: jest.fn(),
  getRepository: jest.fn(),
}));
jest.mock('@modules/users/infra/http/middlewares/ensureAuthenticated', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    if (req.headers.authorization !== 'Bearer test') return res.sendStatus(403);
    req.user = { sync_id: 'verified-sync' };
    next();
  },
}));
let app: express.Express;
let start: jest.SpyInstance;
let list: jest.SpyInstance;
beforeEach(() => {
  process.env.ACTIVITY_LEDGER_ENABLED = 'true';
  start = jest
    .spyOn(ActivityLedger.prototype, 'start')
    .mockResolvedValue({ id: 'event' });
  list = jest
    .spyOn(ActivityLedger.prototype, 'list')
    .mockResolvedValue({ events: [], incomplete_sessions: [] });
  (getRepository as jest.Mock).mockReturnValue({
    findOne: jest
      .fn()
      .mockResolvedValue({ id: 'db-user', sync_id: 'verified-sync' }),
  });
  app = express();
  app.use(express.json());
  app.use('/me/activity', router);
  app.use((error: any, req: any, res: any, next: any) =>
    res.status(error.statusCode || 500).json({ message: error.message }),
  );
});
afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.ACTIVITY_LEDGER_ENABLED;
});
const path = '/me/activity/assets/asset/access-sessions';
const body = { request_id: '10000000-0000-4000-8000-000000000001' };
test('feature defaults off and does not call writer', async () => {
  delete process.env.ACTIVITY_LEDGER_ENABLED;
  expect((await request(app).post(path).send(body)).status).toBe(404);
  expect(start).not.toHaveBeenCalled();
});
test('authentication required', async () =>
  expect((await request(app).post(path).send(body)).status).toBe(403));
test('verified subject is used; body identity spoofing rejected', async () => {
  expect(
    (
      await request(app)
        .post(path)
        .set('Authorization', 'Bearer test')
        .send(body)
    ).status,
  ).toBe(200);
  expect(start).toHaveBeenCalledWith('verified-sync', 'asset', body.request_id);
  expect(
    (
      await request(app)
        .post(path)
        .set('Authorization', 'Bearer test')
        .send({ ...body, actor_user_id: 'spoof' })
    ).status,
  ).toBe(400);
});
test('reads resolve actor on backend, reject scope overrides and bound pagination', async () => {
  expect(
    (
      await request(app)
        .get('/me/activity/events?limit=2')
        .set('Authorization', 'Bearer test')
    ).status,
  ).toBe(200);
  expect(list).toHaveBeenCalledWith('db-user', 2, undefined);
  for (const query of [
    'limit=101',
    'actor_user_id=other',
    'before_id=bad',
    'limit=-1',
  ]) {
    expect(
      (
        await request(app)
          .get(`/me/activity/events?${query}`)
          .set('Authorization', 'Bearer test')
      ).status,
    ).toBe(400);
  }
});
test('unexpected persistence errors are sanitized', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  start.mockRejectedValue(new Error('token=secret database details'));
  const response = await request(app)
    .post(path)
    .set('Authorization', 'Bearer test')
    .send(body);
  expect(response.status).toBe(503);
  expect(JSON.stringify([response.body, warning.mock.calls])).not.toContain(
    'secret',
  );
});
test('preview authorizer uses existing service and rejects nonexistent assets', async () => {
  const execute = jest.fn().mockResolvedValue(undefined);
  jest.spyOn(container, 'resolve').mockReturnValue({ execute } as any);
  await expect(
    authorizePreview('verified-sync', 'asset'),
  ).rejects.toMatchObject({ statusCode: 404 });
  expect(execute).toHaveBeenCalledWith('asset', 'verified-sync');
  execute.mockRejectedValue(new AppError('Forbidden', 403));
  await expect(
    authorizePreview('verified-sync', 'asset'),
  ).rejects.toMatchObject({ statusCode: 403 });
});
