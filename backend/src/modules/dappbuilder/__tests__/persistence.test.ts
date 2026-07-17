import 'express-async-errors';
import express from 'express';
import request from 'supertest';

// ── Mock rate limiter (no-op in tests) ───────────────────────────────────────
jest.mock('../infra/http/middlewares/dappBuilderGuard', () => ({
  dappBuilderRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  validateGenerate:       (_req: unknown, _res: unknown, next: () => void) => next(),
  validateEdit:           (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ── Mock repositories BEFORE importing the router ────────────────────────────
// Jest hoists jest.mock() calls, so the mocks are in place when the router
// module is first evaluated.

const mockDAppRepo = {
  findByOwner:       jest.fn(),
  findSharedWithUser: jest.fn(),
  findById:          jest.fn(),
  findByClientId:    jest.fn(),
  create:            jest.fn(),
  save:              jest.fn(),
  softDelete:        jest.fn(),
  upsertAccess:      jest.fn(),
  removeAccess:      jest.fn(),
  findAccess:        jest.fn(),
};

const mockUsersRepo = {
  findBySyncId: jest.fn(),
  findByEmail:  jest.fn(),
};

jest.mock('@modules/dappbuilder/infra/typeorm/repositories/DAppBuilderRepository', () => {
  return jest.fn().mockImplementation(() => mockDAppRepo);
});

jest.mock('@modules/users/infra/typeorm/repositories/UsersRepository', () => {
  return jest.fn().mockImplementation(() => mockUsersRepo);
});

// ensureDappBuilderAuth — factory uses jest.fn() directly (avoids hoisting TDZ)
jest.mock('../infra/http/middlewares/ensureDappBuilderAuth', () => jest.fn());

// Import router AFTER mocks are wired
import dappBuilderRouter from '../infra/http/routes/dappbuilder.routes';
import AppError from '@shared/errors/AppError';
import ensureAuthImport from '../infra/http/middlewares/ensureDappBuilderAuth';
const mockEnsureAuth = ensureAuthImport as jest.Mock;

// ── Express test app ──────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/dapp-builder', dappBuilderRouter);
  // Minimal AppError → JSON error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: msg });
  });
  return app;
}

// ── Test fixtures ─────────────────────────────────────────────────────────────

const OWNER     = { id: 'owner-uuid',   sync_id: 'owner-sync',   email: 'owner@test.com',   name: 'Owner' };
const OTHER     = { id: 'other-uuid',   sync_id: 'other-sync',   email: 'other@test.com',   name: 'Other' };
const RECIPIENT = { id: 'recip-uuid',   sync_id: 'recip-sync',   email: 'recip@test.com',   name: 'Recip' };
const BUILDER   = { id: 'builder-uuid', sync_id: 'builder-sync', email: 'builder@test.com', name: 'Builder' };
const VIEWER    = { id: 'viewer-uuid',  sync_id: 'viewer-sync',  email: 'viewer@test.com',  name: 'Viewer' };

function makeAppRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-uuid',
    owner_id: OWNER.id,
    dapp_name: 'Test App',
    description: '',
    user_prompt: '',
    template: 'token-dashboard',
    status: 'Draft',
    generated_code: '',
    generated_config: '',
    internal_app_path: '/dapp-builder/apps/app-uuid',
    permission_model: 'role-based',
    apis: [],
    workflow: [],
    version: 1,
    client_id: null,
    access_records: [],
    owner: OWNER,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

function authAs(user: { sync_id: string }) {
  mockEnsureAuth.mockImplementation((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).user = { sync_id: user.sync_id };
    next();
  });
}

function authBlocked() {
  // ensureDappBuilderAuth returns 401 (not 403) for missing/invalid tokens
  mockEnsureAuth.mockImplementation(() => {
    throw new AppError('Authentication required', 401);
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Test 1: unauthenticated GET /apps returns 403 ─────────────────────────────

test('persistence-1: unauthenticated GET /apps returns 401', async () => {
  authBlocked();
  const res = await request(makeApp()).get('/dapp-builder/apps');
  expect(res.status).toBe(401);
  expect(res.body.error).toBeDefined();
});

// ── Test 2: unauthenticated POST /apps returns 401 ───────────────────────────

test('persistence-2: unauthenticated POST /apps returns 401', async () => {
  authBlocked();
  const res = await request(makeApp())
    .post('/dapp-builder/apps')
    .send({ dapp_name: 'Test' });
  expect(res.status).toBe(401);
});

// ── Test 3: body owner_id is ignored; JWT-derived owner_id is used ────────────

test('persistence-3: authenticated create ignores forged owner_id in body', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockDAppRepo.findByClientId.mockResolvedValue(undefined);

  const created = makeAppRecord();
  mockDAppRepo.create.mockResolvedValue(created);
  mockDAppRepo.save.mockResolvedValue(created);
  mockDAppRepo.findById.mockResolvedValue(created);

  const res = await request(makeApp())
    .post('/dapp-builder/apps')
    .set('Authorization', 'Bearer fake-token')
    .send({
      dapp_name: 'Test App',
      owner_id:  'attacker-uuid',   // should be stripped
      ownerId:   'attacker-uuid',   // should be stripped
    });

  expect(res.status).toBe(201);
  expect(mockDAppRepo.create).toHaveBeenCalledWith(
    expect.objectContaining({ owner_id: OWNER.id }),
  );
  expect(mockDAppRepo.create).not.toHaveBeenCalledWith(
    expect.objectContaining({ owner_id: 'attacker-uuid' }),
  );
});

// ── Test 4: owner can retrieve own app ───────────────────────────────────────

test('persistence-4: owner retrieves own app', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockDAppRepo.findById.mockResolvedValue(makeAppRecord());

  const res = await request(makeApp())
    .get('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ id: 'app-uuid', dappName: 'Test App' });
});

// ── Test 5: unrelated user cannot GET app (403) ──────────────────────────────

test('persistence-5: unrelated user cannot retrieve app (403)', async () => {
  authAs(OTHER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OTHER);
  mockDAppRepo.findById.mockResolvedValue(makeAppRecord()); // owned by OWNER, no access for OTHER

  const res = await request(makeApp())
    .get('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(403);
  expect(res.body.error).toBeDefined();
});

// ── Test 6: owner can update app ─────────────────────────────────────────────

test('persistence-6: owner can update app', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  const appRecord = makeAppRecord();
  const updatedRecord = { ...appRecord, dapp_name: 'Updated App' };
  mockDAppRepo.findById
    .mockResolvedValueOnce(appRecord)
    .mockResolvedValueOnce(updatedRecord);
  mockDAppRepo.save.mockResolvedValue(updatedRecord);

  const res = await request(makeApp())
    .put('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token')
    .send({ dapp_name: 'Updated App' });

  expect(res.status).toBe(200);
  expect(res.body.dappName).toBe('Updated App');
});

// ── Test 7: owner can delete app (204) ───────────────────────────────────────

test('persistence-7: owner can delete app (returns 204)', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockDAppRepo.findById.mockResolvedValue(makeAppRecord());
  mockDAppRepo.softDelete.mockResolvedValue(undefined);

  const res = await request(makeApp())
    .delete('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(204);
  expect(mockDAppRepo.softDelete).toHaveBeenCalledWith('app-uuid');
});

// ── Test 8: non-owner cannot delete app (403) ─────────────────────────────────

test('persistence-8: non-owner cannot delete app (403)', async () => {
  authAs(OTHER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OTHER);
  mockDAppRepo.findById.mockResolvedValue(makeAppRecord()); // owned by OWNER

  const res = await request(makeApp())
    .delete('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(403);
  expect(mockDAppRepo.softDelete).not.toHaveBeenCalled();
});

// ── Test 9: owner can share app ──────────────────────────────────────────────

test('persistence-9: owner can share app with valid recipient', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockUsersRepo.findByEmail.mockResolvedValue(RECIPIENT);

  const appRecord = makeAppRecord();
  const sharedRecord = makeAppRecord({
    access_records: [{ user_id: RECIPIENT.id, role: 'Viewer', user: RECIPIENT }],
    status: 'Shared',
  });
  mockDAppRepo.findById
    .mockResolvedValueOnce(appRecord)
    .mockResolvedValueOnce(sharedRecord);
  mockDAppRepo.upsertAccess.mockResolvedValue({ user_id: RECIPIENT.id, role: 'Viewer' });
  mockDAppRepo.save.mockResolvedValue({ ...appRecord, status: 'Shared' });

  const res = await request(makeApp())
    .post('/dapp-builder/apps/app-uuid/share')
    .set('Authorization', 'Bearer fake-token')
    .send({ email: 'recip@test.com', role: 'Viewer' });

  expect(res.status).toBe(200);
  expect(mockDAppRepo.upsertAccess).toHaveBeenCalledWith('app-uuid', RECIPIENT.id, 'Viewer');
});

// ── Test 10: non-owner cannot share app (403) ─────────────────────────────────

test('persistence-10: non-owner cannot share app (403)', async () => {
  authAs(OTHER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OTHER);
  mockDAppRepo.findById.mockResolvedValue(makeAppRecord()); // owned by OWNER

  const res = await request(makeApp())
    .post('/dapp-builder/apps/app-uuid/share')
    .set('Authorization', 'Bearer fake-token')
    .send({ email: 'recip@test.com', role: 'Viewer' });

  expect(res.status).toBe(403);
  expect(mockDAppRepo.upsertAccess).not.toHaveBeenCalled();
});

// ── Test 11: Builder can update app (200) ────────────────────────────────────

test('persistence-11: Builder can update app (200)', async () => {
  authAs(BUILDER);
  mockUsersRepo.findBySyncId.mockResolvedValue(BUILDER);
  const appRecord = makeAppRecord({
    access_records: [{ user_id: BUILDER.id, role: 'Builder', user: BUILDER }],
  });
  const updatedRecord = { ...appRecord, dapp_name: 'Builder Updated' };
  mockDAppRepo.findById
    .mockResolvedValueOnce(appRecord)
    .mockResolvedValueOnce(updatedRecord);
  mockDAppRepo.save.mockResolvedValue(updatedRecord);

  const res = await request(makeApp())
    .put('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token')
    .send({ dapp_name: 'Builder Updated' });

  expect(res.status).toBe(200);
});

// ── Test 12: Viewer cannot update app (403) ──────────────────────────────────

test('persistence-12: Viewer cannot update app (403)', async () => {
  authAs(VIEWER);
  mockUsersRepo.findBySyncId.mockResolvedValue(VIEWER);
  const appRecord = makeAppRecord({
    access_records: [{ user_id: VIEWER.id, role: 'Viewer', user: VIEWER }],
  });
  mockDAppRepo.findById.mockResolvedValue(appRecord);

  const res = await request(makeApp())
    .put('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token')
    .send({ dapp_name: 'Hacked' });

  expect(res.status).toBe(403);
  expect(mockDAppRepo.save).not.toHaveBeenCalled();
});

// ── Test 13: invalid share recipient → 400 "This email is not a valid user." ──

test('persistence-13: share with unknown email returns 400 "This email is not a valid user."', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockDAppRepo.findById.mockResolvedValue(makeAppRecord());
  mockUsersRepo.findByEmail.mockResolvedValue(undefined); // no such user

  const res = await request(makeApp())
    .post('/dapp-builder/apps/app-uuid/share')
    .set('Authorization', 'Bearer fake-token')
    .send({ email: 'nobody@nowhere.com', role: 'Viewer' });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe('This email is not a valid user.');
});

// ── Test 14 (bonus): client_id deduplication ─────────────────────────────────

test('persistence-14: duplicate client_id on POST returns existing app without creating a new one', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  const existing = makeAppRecord({ client_id: 'frontend-uuid-123' });
  mockDAppRepo.findByClientId.mockResolvedValue(existing);
  mockDAppRepo.findById.mockResolvedValue(existing);

  const res = await request(makeApp())
    .post('/dapp-builder/apps')
    .set('Authorization', 'Bearer fake-token')
    .send({ dapp_name: 'Duplicate', client_id: 'frontend-uuid-123' });

  expect(res.status).toBe(201);
  expect(mockDAppRepo.create).not.toHaveBeenCalled();
  expect(res.body.id).toBe('app-uuid');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tests 15-24: Additional coverage
// ─────────────────────────────────────────────────────────────────────────────
// NOTE ON TEST TYPE:
// All persistence tests in this file are HTTP/controller-layer unit tests with
// mocked repositories (DAppBuilderRepository and UsersRepository are replaced
// with jest.fn() objects). They verify routing, auth middleware, controller
// dispatch, and service-layer business logic — but NOT that SQL migrations work
// or that PostgreSQL constraints are enforced. Real database integration tests
// would require a running Postgres instance and are out of scope here.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Test 15: GET /apps returns owned apps ─────────────────────────────────────

test('persistence-15: GET /apps includes apps owned by the requester', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  const owned = makeAppRecord();
  mockDAppRepo.findByOwner.mockResolvedValue([owned]);
  mockDAppRepo.findSharedWithUser.mockResolvedValue([]);

  const res = await request(makeApp())
    .get('/dapp-builder/apps')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].id).toBe('app-uuid');
});

// ── Test 16: GET /apps returns apps shared with the requester ────────────────

test('persistence-16: GET /apps includes apps shared with the requester', async () => {
  authAs(VIEWER);
  mockUsersRepo.findBySyncId.mockResolvedValue(VIEWER);
  // VIEWER owns nothing but has one shared app
  const sharedApp = makeAppRecord({
    access_records: [{ user_id: VIEWER.id, role: 'Viewer', user: VIEWER }],
  });
  mockDAppRepo.findByOwner.mockResolvedValue([]);
  mockDAppRepo.findSharedWithUser.mockResolvedValue([sharedApp]);

  const res = await request(makeApp())
    .get('/dapp-builder/apps')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].id).toBe('app-uuid');
});

// ── Test 17: GET /apps never returns unrelated apps ──────────────────────────

test('persistence-17: GET /apps does not return apps unrelated to the requester', async () => {
  authAs(OTHER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OTHER);
  // OTHER owns nothing and has nothing shared with them
  mockDAppRepo.findByOwner.mockResolvedValue([]);
  mockDAppRepo.findSharedWithUser.mockResolvedValue([]);

  const res = await request(makeApp())
    .get('/dapp-builder/apps')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(0);
});

// ── Test 18: Shared recipient can retrieve an app in a fresh request ──────────

test('persistence-18: shared recipient retrieves app in fresh authenticated request', async () => {
  authAs(VIEWER);
  mockUsersRepo.findBySyncId.mockResolvedValue(VIEWER);
  // App is owned by OWNER but VIEWER has access
  const sharedApp = makeAppRecord({
    access_records: [{ user_id: VIEWER.id, role: 'Viewer', user: VIEWER }],
  });
  mockDAppRepo.findById.mockResolvedValue(sharedApp);

  const res = await request(makeApp())
    .get('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(200);
  expect(res.body.id).toBe('app-uuid');
});

// ── Test 19: Reviewer can read but cannot update ─────────────────────────────

test('persistence-19: Reviewer can read app but cannot update it (403)', async () => {
  const REVIEWER = { id: 'reviewer-uuid', sync_id: 'reviewer-sync', email: 'reviewer@test.com', name: 'Reviewer' };
  authAs(REVIEWER);
  mockUsersRepo.findBySyncId.mockResolvedValue(REVIEWER);

  const appRecord = makeAppRecord({
    access_records: [{ user_id: REVIEWER.id, role: 'Reviewer', user: REVIEWER }],
  });
  mockDAppRepo.findById.mockResolvedValue(appRecord);

  // GET succeeds
  const getRes = await request(makeApp())
    .get('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');
  expect(getRes.status).toBe(200);

  // PUT is rejected
  mockDAppRepo.findById.mockResolvedValue(appRecord); // re-mock for second request
  const putRes = await request(makeApp())
    .put('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token')
    .send({ dapp_name: 'Reviewer Hack' });
  expect(putRes.status).toBe(403);
});

// ── Test 20: removeShare removes access ──────────────────────────────────────

test('persistence-20: removeShare removes the collaborator entry', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);

  const appWithViewer = makeAppRecord({
    access_records: [{ user_id: VIEWER.id, role: 'Viewer', user: VIEWER }],
  });
  const appAfterRemoval = makeAppRecord({ access_records: [] });

  mockDAppRepo.findById
    .mockResolvedValueOnce(appWithViewer)
    .mockResolvedValueOnce(appAfterRemoval);
  mockDAppRepo.removeAccess.mockResolvedValue(undefined);

  const res = await request(makeApp())
    .delete(`/dapp-builder/apps/app-uuid/share/${VIEWER.id}`)
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(200);
  expect(mockDAppRepo.removeAccess).toHaveBeenCalledWith('app-uuid', VIEWER.id);
  expect(res.body.sharedAccess).toHaveLength(0);
});

// ── Test 21: Removed user can no longer retrieve the app ─────────────────────

test('persistence-21: removed collaborator cannot retrieve app after removal (403)', async () => {
  // After removeAccess, app.access_records is empty → VIEWER has no access
  authAs(VIEWER);
  mockUsersRepo.findBySyncId.mockResolvedValue(VIEWER);
  const appWithoutAccess = makeAppRecord({ access_records: [] }); // VIEWER removed
  mockDAppRepo.findById.mockResolvedValue(appWithoutAccess);

  const res = await request(makeApp())
    .get('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token');

  expect(res.status).toBe(403);
});

// ── Test 22: Sharing same user again updates role (upsert, no duplicate) ─────

test('persistence-22: re-sharing same user calls upsertAccess (updates role, no duplicate)', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockUsersRepo.findByEmail.mockResolvedValue(VIEWER);

  const appRecord = makeAppRecord();
  const afterUpsert = makeAppRecord({
    access_records: [{ user_id: VIEWER.id, role: 'Builder', user: VIEWER }],
    status: 'Shared',
  });
  mockDAppRepo.findById
    .mockResolvedValueOnce(appRecord)
    .mockResolvedValueOnce(afterUpsert);
  mockDAppRepo.upsertAccess.mockResolvedValue({ user_id: VIEWER.id, role: 'Builder' });
  mockDAppRepo.save.mockResolvedValue({ ...appRecord, status: 'Shared' });

  const res = await request(makeApp())
    .post('/dapp-builder/apps/app-uuid/share')
    .set('Authorization', 'Bearer fake-token')
    .send({ email: 'viewer@test.com', role: 'Builder' });

  expect(res.status).toBe(200);
  // upsertAccess called once — the repository handles deduplication
  expect(mockDAppRepo.upsertAccess).toHaveBeenCalledTimes(1);
  expect(mockDAppRepo.upsertAccess).toHaveBeenCalledWith('app-uuid', VIEWER.id, 'Builder');
});

// ── Test 23: owner_id, sharedWith, sharedAccess cannot be forged via create ──

test('persistence-23: create ignores forged sharedWith/sharedAccess in request body', async () => {
  authAs(OWNER);
  mockUsersRepo.findBySyncId.mockResolvedValue(OWNER);
  mockDAppRepo.findByClientId.mockResolvedValue(undefined);

  const created = makeAppRecord();
  mockDAppRepo.create.mockResolvedValue(created);
  mockDAppRepo.save.mockResolvedValue(created);
  mockDAppRepo.findById.mockResolvedValue(created);

  const res = await request(makeApp())
    .post('/dapp-builder/apps')
    .set('Authorization', 'Bearer fake-token')
    .send({
      dapp_name: 'Test',
      owner_id:    'attacker-uuid',
      sharedWith:  ['victim@test.com'],
      sharedAccess: [{ email: 'victim@test.com', role: 'Builder' }],
    });

  expect(res.status).toBe(201);
  // create() was called without attacker's owner_id or sharedWith/sharedAccess
  const createArg = (mockDAppRepo.create as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
  expect(createArg.owner_id).toBe(OWNER.id);
  expect(createArg.owner_id).not.toBe('attacker-uuid');
  expect(createArg.sharedWith).toBeUndefined();
  expect(createArg.sharedAccess).toBeUndefined();
});

// ── Test 24: Builder cannot modify ownership or access-control fields ─────────

test('persistence-24: Builder update cannot change owner_id or access fields', async () => {
  authAs(BUILDER);
  mockUsersRepo.findBySyncId.mockResolvedValue(BUILDER);

  const appRecord = makeAppRecord({
    access_records: [{ user_id: BUILDER.id, role: 'Builder', user: BUILDER }],
  });
  const updatedRecord = { ...appRecord, dapp_name: 'Builder Updated' };
  mockDAppRepo.findById
    .mockResolvedValueOnce(appRecord)
    .mockResolvedValueOnce(updatedRecord);
  mockDAppRepo.save.mockResolvedValue(updatedRecord);

  const res = await request(makeApp())
    .put('/dapp-builder/apps/app-uuid')
    .set('Authorization', 'Bearer fake-token')
    .send({
      dapp_name:   'Builder Updated',
      owner_id:    'attacker-uuid',       // ignored by UpdateAppInput
      sharedWith:  ['victim@test.com'],   // ignored by UpdateAppInput
      sharedAccess: [],                   // ignored by UpdateAppInput
    });

  expect(res.status).toBe(200);
  // The saved entity's owner_id must still be OWNER.id (unchanged)
  const saveArg = (mockDAppRepo.save as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
  expect(saveArg.owner_id).toBe(OWNER.id);
  expect(saveArg.owner_id).not.toBe('attacker-uuid');
});
