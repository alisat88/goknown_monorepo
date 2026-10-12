import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

import { PostgresZtaHandoffStore } from '../PostgresZtaHandoffStore';
import { ZtaHandoffService } from '../ZtaHandoffService';
import { CreateStrictLoginFoundation1791800000000 } from '../../../shared/infra/typeorm/migrations/1791800000000-CreateStrictLoginFoundation';
import { RevokeStrictSessionsOnInactive1791800001000 } from '../../../shared/infra/typeorm/migrations/1791800001000-RevokeStrictSessionsOnInactive';
import { CreateZtaHandoffCodes1791800002000 } from '../../../shared/infra/typeorm/migrations/1791800002000-CreateZtaHandoffCodes';

const suite = process.env.RUN_STRICT_LOCAL_PG === '1' ? describe : describe.skip;
suite('ZTA handoff on disposable PostgreSQL', () => {
  let db: Connection;
  const userId = randomUUID();
  const parentHash = 'a'.repeat(64);
  const verifier = 'v'.repeat(43);
  const challenge = require('crypto').createHash('sha256').update(verifier).digest('base64url');
  const config = { clientId: 'zta-web', redirectUri: 'https://zta.test/callback' };

  beforeAll(async () => {
    db = await createConnection({
      name: 'handoff-disposable-test',
      type: 'postgres',
      host: '/private/tmp/dappgenius-strict-test-socket',
      port: 55439,
      username: 'strict_test',
      database: 'strict_session_test',
      logging: false,
    });
    await db.query(`CREATE TABLE users (id uuid PRIMARY KEY, email text NOT NULL, password text NOT NULL,
      status text NOT NULL, deleted_at timestamptz, "twoFactorAuthentication" boolean NOT NULL,
      sync_id text, pin text, pin_created_at timestamptz)`);
    const runner = db.createQueryRunner();
    try {
      await new CreateStrictLoginFoundation1791800000000().up(runner);
      await new RevokeStrictSessionsOnInactive1791800001000().up(runner);
      await new CreateZtaHandoffCodes1791800002000().up(runner);
    } finally {
      await runner.release();
    }
    await db.query(
      `INSERT INTO users VALUES ($1,'handoff@example.test',$2,'active',NULL,true,NULL,NULL,NULL)`,
      [userId, await hash('not-used', 4)],
    );
    await db.query(
      `INSERT INTO strict_login_sessions (hash,user_id,credential_hash,expires_at,revoked_at)
       VALUES ($1,$2,$3,CURRENT_TIMESTAMP + interval '1 hour',NULL)`,
      [parentHash, userId, 'f'.repeat(64)],
    );
  });

  afterAll(async () => {
    const runner = db.createQueryRunner();
    try {
      await new CreateZtaHandoffCodes1791800002000().down(runner);
      await new RevokeStrictSessionsOnInactive1791800001000().down(runner);
      await new CreateStrictLoginFoundation1791800000000().down(runner);
    } finally {
      await runner.release();
    }
    await db.query('DROP TABLE users');
    await db.close();
  });

  beforeEach(async () => {
    await db.query('TRUNCATE strict_zta_handoff_codes');
    await db.query("UPDATE strict_login_sessions SET revoked_at=NULL, expires_at=CURRENT_TIMESTAMP + interval '1 hour'");
  });

  test('redeems exactly once under concurrency and rejects replay', async () => {
    const service = new ZtaHandoffService(new PostgresZtaHandoffStore(() => db), config);
    const issued = await service.issue(userId, parentHash, {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      state: 'state-1',
      codeChallenge: challenge,
    });
    const results = await Promise.allSettled([
      service.redeem({ code: issued.code, clientId: config.clientId, redirectUri: config.redirectUri, state: 'state-1', codeVerifier: verifier }),
      service.redeem({ code: issued.code, clientId: config.clientId, redirectUri: config.redirectUri, state: 'state-1', codeVerifier: verifier }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
  });

  test('revoked parent session prevents a new redemption', async () => {
    await db.query('UPDATE strict_login_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE hash=$1', [parentHash]);
    const service = new ZtaHandoffService(new PostgresZtaHandoffStore(() => db), config);
    const issued = await service.issue(userId, parentHash, {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      state: 'state-2',
      codeChallenge: challenge,
    }).catch(error => error);
    expect(issued).toBeInstanceOf(Error);
  });
});
