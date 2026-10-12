import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sign } from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';
import { StrictSessionService, digest } from '../StrictSessionService';
import { PostgresStrictStore } from '../PostgresStrictStore';
import { createStrictSessionsRouter } from '../strictSessions.routes';
import { StrictLoginChallenge } from '../entities/StrictLoginChallenge';
import { StrictLoginThrottle } from '../entities/StrictLoginThrottle';
import { StrictLoginSession } from '../entities/StrictLoginSession';
import { CreateStrictLoginFoundation1791800000000 } from '../../../shared/infra/typeorm/migrations/1791800000000-CreateStrictLoginFoundation';
import { RevokeStrictSessionsOnInactive1791800001000 } from '../../../shared/infra/typeorm/migrations/1791800001000-RevokeStrictSessionsOnInactive';

// Hard-coded disposable Unix socket: never reads DATABASE_URL or production config.
// Opt-in avoids starting infrastructure as part of ordinary legacy test runs.
const suite =
  process.env.RUN_STRICT_LOCAL_PG === '1' ? describe : describe.skip;
suite('isolated strict sessions on disposable PostgreSQL', () => {
  let db: Connection;
  let service: StrictSessionService;
  let mail: jest.Mock;
  let userId: string;
  let passwordHash: string;
  let app: express.Express;
  const password = 'test-only-password';
  const email = 'strict-test@example.test';
  const query = (sql: string, args: unknown[] = []) => db.query(sql, args);
  const start = () => service.start(email, password);
  const finish = async () => {
    const challenge = await start();
    const latestMail = mail.mock.calls[mail.mock.calls.length - 1];
    return service.verify(challenge.challenge, latestMail[1]);
  };
  beforeAll(async () => {
    db = await createConnection({
      name: 'strict-disposable-test',
      type: 'postgres',
      host: '/private/tmp/dappgenius-strict-test-socket',
      port: 55439,
      username: 'strict_test',
      database: 'strict_session_test',
      logging: false,
      synchronize: false,
      entities: [StrictLoginChallenge, StrictLoginSession, StrictLoginThrottle],
    });
    await query(`CREATE TABLE users (id uuid PRIMARY KEY, email text NOT NULL, password text NOT NULL,
      status text NOT NULL, deleted_at timestamptz, "twoFactorAuthentication" boolean NOT NULL,
      sync_id text, pin text, pin_created_at timestamptz)`);
    const runner = db.createQueryRunner();
    try {
      await new CreateStrictLoginFoundation1791800000000().up(runner);
      await new RevokeStrictSessionsOnInactive1791800001000().up(runner);
    } finally {
      await runner.release();
    }
    passwordHash = await hash(password, 4);
  });
  afterAll(async () => {
    if (db?.isConnected) {
      const runner = db.createQueryRunner();
      try {
        await new RevokeStrictSessionsOnInactive1791800001000().down(runner);
        await new CreateStrictLoginFoundation1791800000000().down(runner);
      } finally {
        await runner.release();
      }
      expect((await query('SELECT count(*) FROM users'))[0]).toBeDefined();
      await query('DROP TABLE users');
      await db.close();
    }
  });
  beforeEach(async () => {
    await query(
      'TRUNCATE strict_login_throttles, strict_login_challenges, strict_login_sessions, users',
    );
    userId = randomUUID();
    await query(
      `INSERT INTO users VALUES ($1,$2,$3,'active',NULL,true,'untrusted-sync','legacy-pin',now())`,
      [userId, email, passwordHash],
    );
    mail = jest.fn().mockResolvedValue(undefined);
    service = new StrictSessionService(new PostgresStrictStore(() => db), mail);
    app = express();
    app.use(express.json());
    app.use(
      '/strict-sessions',
      createStrictSessionsRouter(service, () => true),
    );
  });
  test('fresh password then email code creates an opaque session bound to canonical ID', async () => {
    const before = await query('SELECT * FROM users');
    const challenge = await start();
    expect((await query('SELECT * FROM strict_login_sessions')).length).toBe(0);
    expect(mail.mock.calls[0][0]).toBe(email);
    expect(mail.mock.calls[0][1]).toMatch(/^\d{8}$/);
    const saved = (await query('SELECT * FROM strict_login_challenges'))[0];
    expect(saved.code_hash).not.toBe(mail.mock.calls[0][1]);
    expect(saved.hash).not.toBe(challenge.challenge);
    const session = await service.verify(
      challenge.challenge,
      mail.mock.calls[0][1],
    );
    expect(await service.validate(session.token)).toEqual({
      userId,
      expiresAt: session.expiresAt,
    });
    expect(session.token).toMatch(/^dgs1_[A-Za-z0-9_-]{43}$/);
    expect((await query('SELECT * FROM strict_login_sessions'))[0].hash).toBe(
      digest(session.token),
    );
    expect(await query('SELECT * FROM users')).toEqual(before);
  });
  test('password budget is shared, atomic and expires', async () => {
    const otherNode = new StrictSessionService(
      new PostgresStrictStore(() => db),
      mail,
    );
    const outcomes = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) =>
        (i % 2 ? service : otherNode).start(email, 'wrong'),
      ),
    );
    expect(outcomes.filter((r: any) => r.reason.status === 429)).toHaveLength(
      2,
    );
    await expect(start()).rejects.toMatchObject({ status: 429 });
    await query(
      "UPDATE strict_login_throttles SET expires_at = now() - interval '1 second'",
    );
    await expect(start()).resolves.toHaveProperty('challenge');
  });
  test('incorrect password creates no challenge or session', async () => {
    await expect(service.start(email, 'wrong')).rejects.toMatchObject({
      status: 401,
    });
    expect(mail).not.toHaveBeenCalled();
    expect(await query('SELECT * FROM strict_login_challenges')).toEqual([]);
  });
  test('unknown or ambiguous normalized email fails closed', async () => {
    await expect(
      service.start('missing@example.test', password),
    ).rejects.toMatchObject({ status: 401 });
    await query(
      `INSERT INTO users VALUES ($1,$2,$3,'active',NULL,true,'other',NULL,NULL)`,
      [randomUUID(), email.toUpperCase(), passwordHash],
    );
    await expect(start()).rejects.toMatchObject({ status: 401 });
  });
  test('invalid codes persist attempts and exhaust the challenge at five', async () => {
    const challenge = await start();
    const code = mail.mock.calls[0][1];
    const wrong = code === '00000000' ? '11111111' : '00000000';
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        service.verify(challenge.challenge, wrong),
      ).rejects.toMatchObject({ status: 401 });
    }
    expect(
      (await query('SELECT attempts FROM strict_login_challenges'))[0].attempts,
    ).toBe(5);
    await expect(
      service.verify(challenge.challenge, code),
    ).rejects.toMatchObject({ status: 401 });
  });
  test('expired code and registration PIN cannot complete strict login', async () => {
    const challenge = await start();
    await expect(
      service.verify(challenge.challenge, 'legacy-pin'),
    ).rejects.toMatchObject({ status: 401 });
    await query(
      "UPDATE strict_login_challenges SET expires_at = now() - interval '1 second'",
    );
    await expect(
      service.verify(challenge.challenge, mail.mock.calls[0][1]),
    ).rejects.toMatchObject({ status: 401 });
  });
  test('challenge reuse cannot issue a second session', async () => {
    const challenge = await start();
    const code = mail.mock.calls[0][1];
    await service.verify(challenge.challenge, code);
    await expect(
      service.verify(challenge.challenge, code),
    ).rejects.toMatchObject({ status: 401 });
    expect((await query('SELECT * FROM strict_login_sessions')).length).toBe(1);
  });
  test('concurrent verification on independent connections consumes once', async () => {
    const challenge = await start();
    const code = mail.mock.calls[0][1];
    const otherNode = new StrictSessionService(
      new PostgresStrictStore(() => db),
      mail,
    );
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        (i % 2 ? service : otherNode).verify(challenge.challenge, code),
      ),
    );
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await query('SELECT * FROM strict_login_sessions')).length).toBe(1);
    expect(
      (await query('SELECT attempts FROM strict_login_challenges'))[0].attempts,
    ).toBe(1);
  });
  test('concurrent wrong codes cannot exceed attempt cap', async () => {
    const challenge = await start();
    const wrong =
      mail.mock.calls[0][1] === '00000000' ? '11111111' : '00000000';
    await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        service.verify(challenge.challenge, wrong),
      ),
    );
    expect(
      (await query('SELECT attempts FROM strict_login_challenges'))[0].attempts,
    ).toBe(5);
  });
  test('new challenges require password and supersede old challenges after shared cooldown', async () => {
    const first = await start();
    await expect(start()).rejects.toMatchObject({ status: 429 });
    await query(
      "UPDATE strict_login_challenges SET created_at = now() - interval '61 seconds'",
    );
    const second = await start();
    await expect(
      service.verify(first.challenge, mail.mock.calls[0][1]),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      service.verify(second.challenge, mail.mock.calls[1][1]),
    ).resolves.toHaveProperty('token');
  });
  test('delivery failure invalidates challenge and never returns credentials', async () => {
    mail.mockRejectedValue(new Error('provider-sensitive-detail'));
    await expect(start()).rejects.toMatchObject({
      status: 503,
      message: 'Verification delivery unavailable',
    });
    expect(
      (await query('SELECT consumed_at FROM strict_login_challenges'))[0]
        .consumed_at,
    ).not.toBeNull();
    expect(await query('SELECT * FROM strict_login_sessions')).toEqual([]);
  });
  test('session write failure rolls back challenge consumption', async () => {
    const challenge = await start();
    await query(
      'ALTER TABLE strict_login_sessions ADD CONSTRAINT test_failure CHECK (false)',
    );
    try {
      await expect(
        service.verify(challenge.challenge, mail.mock.calls[0][1]),
      ).rejects.toBeDefined();
    } finally {
      await query(
        'ALTER TABLE strict_login_sessions DROP CONSTRAINT test_failure',
      );
    }
    expect(
      (await query('SELECT consumed_at FROM strict_login_challenges'))[0]
        .consumed_at,
    ).toBeNull();
    await expect(
      service.verify(challenge.challenge, mail.mock.calls[0][1]),
    ).resolves.toHaveProperty('token');
  });
  test.each(['inactive', 'deleted', 'password', 'email'])(
    '%s changes invalidate an issued session',
    async change => {
      const session = await finish();
      if (change === 'inactive')
        await query("UPDATE users SET status='inactive'");
      if (change === 'deleted')
        await query('UPDATE users SET deleted_at=now()');
      if (change === 'password')
        await query("UPDATE users SET password='changed-hash'");
      if (change === 'email')
        await query("UPDATE users SET email='changed@example.test'");
      await expect(service.validate(session.token)).rejects.toMatchObject({
        status: 401,
      });
      expect(
        (await query('SELECT revoked_at FROM strict_login_sessions'))[0]
          .revoked_at,
      ).not.toBeNull();
    },
  );
  test('password reset between challenge creation and verification rejects old proof', async () => {
    const challenge = await start();
    await query("UPDATE users SET password='replacement-password-hash'");
    await expect(
      service.verify(challenge.challenge, mail.mock.calls[0][1]),
    ).rejects.toMatchObject({ status: 401 });
    expect(await query('SELECT * FROM strict_login_sessions')).toEqual([]);
  });
  test('physical deletion cascades only strict records and invalidates access', async () => {
    const session = await finish();
    await query('DELETE FROM users WHERE id=$1', [userId]);
    expect(await query('SELECT * FROM strict_login_sessions')).toEqual([]);
    expect(await query('SELECT * FROM strict_login_challenges')).toEqual([]);
    await expect(service.validate(session.token)).rejects.toMatchObject({
      status: 401,
    });
  });
  test('inactive users cannot start or finish login', async () => {
    await query("UPDATE users SET status='inactive'");
    await expect(start()).rejects.toMatchObject({ status: 401 });
    await query("UPDATE users SET status='active'");
    const challenge = await start();
    await query("UPDATE users SET status='inactive'");
    await expect(
      service.verify(challenge.challenge, mail.mock.calls[0][1]),
    ).rejects.toMatchObject({ status: 401 });
  });
  test('disable then re-enable permanently revokes old strict sessions', async () => {
    const session = await finish();
    await query("UPDATE users SET status='inactive'");
    await query("UPDATE users SET status='active'");
    await expect(service.validate(session.token)).rejects.toMatchObject({
      status: 401,
    });
    await query(
      "UPDATE strict_login_challenges SET created_at = now() - interval '61 seconds'",
    );
    const fresh = await finish();
    await expect(service.validate(fresh.token)).resolves.toHaveProperty(
      'userId',
      userId,
    );
  });
  test('multiple strict sessions are all revoked by one disable transition', async () => {
    const first = await finish();
    await query("UPDATE strict_login_challenges SET created_at = now() - interval '61 seconds'");
    const second = await finish();
    await query("UPDATE users SET status='inactive'");
    const sessions = await query(
      'SELECT revoked_at FROM strict_login_sessions ORDER BY hash',
    );
    expect(sessions).toHaveLength(2);
    expect(sessions.every((row: { revoked_at: Date | null }) => row.revoked_at)).toBe(true);
    await expect(service.validate(first.token)).rejects.toMatchObject({ status: 401 });
    await expect(service.validate(second.token)).rejects.toMatchObject({ status: 401 });
  });
  test('a concurrent login cannot commit after a disablement wins the user lock', async () => {
    const runner = db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      const pendingLogin = finish();
      await new Promise(resolve => setTimeout(resolve, 50));
      await runner.query("UPDATE users SET status='inactive' WHERE id=$1", [userId]);
      await runner.commitTransaction();
      await expect(pendingLogin).rejects.toMatchObject({ status: 401 });
      expect(mail).not.toHaveBeenCalled();
      expect(await query('SELECT * FROM strict_login_sessions')).toEqual([]);
    } finally {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      await runner.release();
    }
  });
  test('failed status transaction rolls back trigger revocations', async () => {
    const session = await finish();
    const runner = db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query("UPDATE users SET status='inactive' WHERE id=$1", [userId]);
      await runner.rollbackTransaction();
    } finally {
      await runner.release();
    }
    await expect(service.validate(session.token)).resolves.toHaveProperty(
      'userId',
      userId,
    );
  });
  test('unrelated user updates do not revoke strict sessions', async () => {
    const session = await finish();
    await query("UPDATE users SET pin='unrelated-update'");
    await expect(service.validate(session.token)).resolves.toHaveProperty(
      'userId',
      userId,
    );
  });
  test('expired or forged strict credential fails', async () => {
    const session = await finish();
    await expect(
      service.validate('dgs1_' + 'a'.repeat(43)),
    ).rejects.toMatchObject({ status: 401 });
    await query(
      "UPDATE strict_login_sessions SET expires_at = now() - interval '1 second'",
    );
    await expect(service.validate(session.token)).rejects.toMatchObject({
      status: 401,
    });
  });
  test('logout revokes immediately across service instances', async () => {
    const session = await finish();
    await request(app)
      .post('/strict-sessions/logout')
      .set('Authorization', 'Bearer ' + session.token)
      .send({})
      .expect(204);
    const otherNode = new StrictSessionService(
      new PostgresStrictStore(() => db),
      mail,
    );
    await expect(otherNode.validate(session.token)).rejects.toMatchObject({
      status: 401,
    });
    await request(app)
      .get('/strict-sessions/current')
      .set('Authorization', 'Bearer ' + session.token)
      .expect(401);
  });
  test.each([
    {},
    { twoFactorAuthentication: true, role: 'admin' },
    { purpose: 'other' },
  ])(
    'legacy/pre-auth/wrong-purpose JWT cannot authorize strict access or issuance: %j',
    async claims => {
      const token = sign(claims, 'test-only-legacy-secret', {
        subject: userId,
        expiresIn: '1h',
      });
      await request(app)
        .get('/strict-sessions/current')
        .set('Authorization', 'Bearer ' + token)
        .expect(401);
      await request(app)
        .post('/strict-sessions/challenges')
        .set('Authorization', 'Bearer ' + token)
        .send({})
        .expect(400);
      await request(app)
        .post('/strict-sessions/verify')
        .set('Authorization', 'Bearer ' + token)
        .send({ token })
        .expect(400);
      expect(await query('SELECT * FROM strict_login_sessions')).toEqual([]);
    },
  );
  test('strict HTTP contract rejects client identity fields and returns only own session state', async () => {
    for (const field of [
      'sync_id',
      'userId',
      'user_id',
      'role',
      'authenticated',
      'twoFactorAuthentication',
    ]) {
      await request(app)
        .post('/strict-sessions/challenges')
        .send({ email, password, [field]: userId })
        .expect(400);
    }
    const initiated = await request(app)
      .post('/strict-sessions/challenges')
      .send({ email, password })
      .expect(201);
    const verified = await request(app)
      .post('/strict-sessions/verify')
      .send({
        challenge: initiated.body.challenge,
        code: mail.mock.calls[0][1],
      })
      .expect(200);
    const response = await request(app)
      .get('/strict-sessions/current')
      .set('Authorization', 'Bearer ' + verified.body.token)
      .expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      authenticated: true,
      expiresAt: verified.body.expiresAt,
    });
    await request(app)
      .get('/strict-sessions/current?user_id=someone-else')
      .set('Authorization', 'Bearer ' + verified.body.token)
      .expect(400);
  });
  test('shared or client-selected sync_id never changes strict ownership', async () => {
    await query(
      `INSERT INTO users VALUES ($1,'other@example.test',$2,'active',NULL,true,'untrusted-sync',NULL,NULL)`,
      [randomUUID(), passwordHash],
    );
    expect((await service.validate((await finish()).token)).userId).toBe(
      userId,
    );
  });
  test('infrastructure errors are redacted at HTTP boundary', async () => {
    const failed = express();
    failed.use(express.json());
    failed.use(
      '/strict-sessions',
      createStrictSessionsRouter(
        {
          start: async () => {
            throw new Error('sensitive-provider-details');
          },
        } as any,
        () => true,
      ),
    );
    const response = await request(failed)
      .post('/strict-sessions/challenges')
      .send({ email, password })
      .expect(503);
    expect(response.body).toEqual({
      error: 'Strict authentication unavailable',
    });
  });
  test('disabled router returns 404 without invoking authentication', async () => {
    const disabled = express();
    disabled.use(express.json());
    const never = { start: jest.fn() } as any;
    disabled.use(
      '/strict-sessions',
      createStrictSessionsRouter(never, () => false),
    );
    await request(disabled)
      .post('/strict-sessions/challenges')
      .send({ email, password })
      .expect(404);
    expect(never.start).not.toHaveBeenCalled();
  });
});
