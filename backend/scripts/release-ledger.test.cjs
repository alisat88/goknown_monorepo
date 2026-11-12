'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  config,
  pin,
  confirmation,
  inspect,
  release,
  NAME,
} = require('./release-ledger.cjs');
const target = {
  version: 1,
  host: '127.0.0.1',
  port: 55469,
  database: 'ledger_local_20261110',
  databaseOid: 1234,
  migrationRole: 'ledger_migrator',
  runtimeRole: 'ledger_runtime',
  addresses: ['127.0.0.1'],
  tls: 'local-only',
};
const credential =
  'postgresql://ledger_migrator:synthetic@127.0.0.1:55469/ledger_local_20261110';
test('credentials are separate from manifest; no ambient runtime URL accepted', () => {
  assert.equal(config(target, credential).user, target.migrationRole);
  assert.throws(
    () => config(target, credential, { DATABASE_URL: 'secret' }),
    /AMBIENT/,
  );
  assert.throws(() => config(target, undefined), /CREDENTIAL_REQUIRED/);
});
for (const [label, url] of [
  ['host', credential.replace('127.0.0.1', '192.0.2.1')],
  ['database', credential.replace('ledger_local_20261110', 'wrong_db')],
  ['role', credential.replace('ledger_migrator', 'ledger_runtime')],
  ['port', credential.replace('55469', '5432')],
  ['TLS override', credential + '?sslmode=disable'],
])
  test(`rejects mismatched ${label} before connecting`, () =>
    assert.throws(() => config(target, url)));
test('remote plaintext and identical owner/runtime are prohibited', () => {
  assert.throws(
    () =>
      config(
        { ...target, host: '192.0.2.1', addresses: ['192.0.2.1'] },
        credential.replace('127.0.0.1', '192.0.2.1'),
      ),
    /TLS/,
  );
  assert.throws(
    () => config({ ...target, runtimeRole: target.migrationRole }, credential),
    /ROLES_MUST_DIFFER/,
  );
});
test('DNS allowlist checks every answer and returns pinned IP', async () => {
  const t = { ...target, host: 'database.example.invalid' };
  assert.equal(
    await pin(t, async () => [{ address: '127.0.0.1' }]),
    '127.0.0.1',
  );
  await assert.rejects(
    pin(t, async () => [{ address: '127.0.0.1' }, { address: '192.0.2.1' }]),
    /DNS_TARGET/,
  );
});
test('confirmation binds manifest and compiled migration digest', () => {
  assert.notEqual(confirmation(target, 'a'), confirmation(target, 'b'));
  assert.notEqual(
    confirmation(target, 'a'),
    confirmation({ ...target, databaseOid: 1235 }, 'a'),
  );
});
function fake({ mismatch = false, unsafe = false, history = [] } = {}) {
  return {
    query: async sql => {
      if (sql.includes('current_database() AS db'))
        return {
          rows: [
            {
              db: mismatch ? 'wrong' : target.database,
              role: target.migrationRole,
              address: target.host,
              port: target.port,
              oid: target.databaseOid,
              recovery: false,
            },
          ],
        };
      if (sql.includes('FROM pg_roles WHERE rolname'))
        return { rows: [{ rolsuper: unsafe }, {}, {}] };
      if (sql.includes('AS owner_member'))
        return {
          rows: [{ owner_member: false, can_create: false, db_owner: false }],
        };
      if (sql.includes('pg_extension')) return { rowCount: 1 };
      if (sql.includes('FROM public.migrations')) return { rows: history };
      return { rows: [] };
    },
  };
}
test('server identity and administrative roles fail closed', async () => {
  await assert.rejects(
    inspect(fake({ mismatch: true }), target, [NAME]),
    /IDENTITY/,
  );
  await assert.rejects(
    inspect(fake({ unsafe: true }), target, [NAME]),
    /ROLE_ATTRIBUTES/,
  );
});
test('missing baseline and unknown migrations rejected', async () => {
  await assert.rejects(
    inspect(fake(), target, ['Baseline1700000000000', NAME]),
    /BASELINE/,
  );
  await assert.rejects(
    inspect(
      fake({
        history: [{ name: 'Unknown1700000000000', timestamp: '1700000000000' }],
      }),
      target,
      [NAME],
    ),
    /UNREVIEWED/,
  );
});
test('invalid confirmation never opens a connection', async () => {
  let connected = false;
  class Client {
    constructor() {
      connected = true;
    }
  }
  await assert.rejects(
    release({
      mode: 'migrate',
      target,
      credential,
      confirmed: 'wrong',
      env: {},
      Client,
    }),
    /CONFIRMATION/,
  );
  assert.equal(connected, false);
});
test('startup entrypoints do not run migrations or schema synchronization', () => {
  const fs = require('node:fs'),
    path = require('node:path');
  for (const file of [
    'backend/Procfile',
    'backend/docker-compose.yaml',
    'local-env/docker-compose.yml',
    'local-env/backend-start.sh',
    'local-env/fix-database.sh',
  ]) {
    const contents = fs.readFileSync(
      path.resolve(__dirname, '../..', file),
      'utf8',
    );
    assert(!/migration:run|TRUNCATE TABLE migrations/.test(contents), file);
  }
  const startup = fs.readFileSync(
    path.resolve(__dirname, '../src/shared/infra/typeorm/index.ts'),
    'utf8',
  );
  assert.match(startup, /migrationsRun: false/);
  assert.match(startup, /synchronize: false/);
});
test('ledger permission SQL grants only schema usage to the runtime role', () => {
  const sql = require('node:fs').readFileSync(
    require('node:path').resolve(__dirname, '../release/ledger-permissions.sql'),
    'utf8',
  );
  assert.match(sql, /REVOKE ALL ON SCHEMA activity_ledger FROM PUBLIC/);
  assert.match(sql, /GRANT USAGE ON SCHEMA activity_ledger TO :"runtime_role"/);
  assert.doesNotMatch(sql, /GRANT CREATE ON SCHEMA activity_ledger TO :"runtime_role"/);
});
test('legacy mutating CLI is blocked before dotenv or credentials are loaded', () => {
  const { spawnSync } = require('node:child_process');
  for (const command of [
    'migration:run',
    'migration:revert',
    'schema:sync',
    'schema:drop',
  ]) {
    const r = spawnSync(
      process.execPath,
      ['-e', `process.argv.push('${command}');require('./ormconfig.js')`],
      {
        cwd: require('node:path').resolve(__dirname, '..'),
        encoding: 'utf8',
        env: {
          PATH: process.env.PATH,
          DATABASE_URL: 'postgresql://secret:never-print@unintended.invalid/db',
        },
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /legacy mutating TypeORM CLI is disabled/);
    assert(!r.stderr.includes('never-print'));
    assert.equal(r.stdout, '');
  }
});
test('unexpected database failures never expose credentials through CLI', () => {
  const { spawnSync } = require('node:child_process');
  const fs = require('node:fs'),
    os = require('node:os'),
    path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-release-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'target.json'), JSON.stringify(target));
    const r = spawnSync(
      process.execPath,
      [
        path.join(__dirname, 'release-ledger.cjs'),
        'verify',
        path.join(dir, 'target.json'),
      ],
      {
        env: {
          PATH: process.env.PATH,
          LEDGER_MIGRATION_DATABASE_URL:
            'postgresql://ledger_migrator:never-print@unintended.invalid:55469/ledger_local_20261110',
        },
        encoding: 'utf8',
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /CREDENTIAL_TARGET_MISMATCH/);
    assert(!r.stderr.includes('never-print'));
    assert.equal(r.stdout, '');
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
