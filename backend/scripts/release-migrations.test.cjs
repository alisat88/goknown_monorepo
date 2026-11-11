'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readPlan, validatePlanCoverage, pendingMigrations, inspectGeneral, PLAN_KIND } = require('./release-migrations.cjs');
const { config, confirmation } = require('./release-ledger.cjs');

const target = {
  version: 1, host: '127.0.0.1', port: 55469, database: 'ledger_local_20261110',
  databaseOid: 1234, migrationRole: 'ledger_migrator', runtimeRole: 'ledger_runtime',
  addresses: ['127.0.0.1'], tls: 'local-only',
};
const credential = 'postgresql://ledger_migrator:synthetic@127.0.0.1:55469/ledger_local_20261110';
const migrations = new Map([
  ['Baseline1700000000000', { file: '1700000000000-Baseline.js', Migration: class Baseline1700000000000 {} }],
  ['CreateActivityLedger1792000000000', { file: '1792000000000-CreateActivityLedger.js', Migration: class CreateActivityLedger1792000000000 {} }],
  ['Future1793000000000', { file: '1793000000000-Future.js', Migration: class Future1793000000000 {} }],
]);

function planFile(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-plan-test-'));
  const file = path.join(dir, 'plan.json');
  fs.writeFileSync(file, JSON.stringify({ version: 1, migrations: names }));
  return { dir, file };
}

test('plan rejects unknown, duplicate, and out-of-order migrations', () => {
  for (const names of [['Unknown1700000000000'], ['Baseline1700000000000', 'Baseline1700000000000'], ['Future1793000000000', 'Baseline1700000000000']]) {
    const { dir, file } = planFile(names);
    try { assert.throws(() => readPlan(file, migrations)); } finally { fs.rmSync(dir, { recursive: true }); }
  }
});

test('plan requires every built migration, preventing unapproved pending work', () => {
  const { dir, file } = planFile(['Baseline1700000000000', 'CreateActivityLedger1792000000000']);
  try { assert.throws(() => validatePlanCoverage(readPlan(file, migrations), migrations), /UNAPPROVED/); }
  finally { fs.rmSync(dir, { recursive: true }); }
});

function fakeClient(history, identity = {}) {
  return {
    query: async sql => {
      if (sql.includes('current_database() AS db')) return { rows: [{ db: target.database, role: target.migrationRole, address: target.host, port: target.port, oid: target.databaseOid, recovery: false, ...identity }] };
      if (sql.includes('FROM pg_roles WHERE rolname')) return { rows: [{ rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false }, { rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false }] };
      if (sql.includes('AS owner_member')) return { rows: [{ owner_member: false, can_create: false, db_owner: false }] };
      if (sql.includes('pg_extension')) return { rows: [{}], rowCount: 1 };
      if (sql.includes('FROM public.migrations')) return { rows: history };
      return { rows: [] };
    }, on: () => {}, connect: async () => {}, end: async () => {},
  };
}

test('history identity and timestamp inconsistencies fail closed', async () => {
  await assert.rejects(inspectGeneral(fakeClient([{ name: 'Baseline1700000000000', timestamp: '1700000000001' }]), target, ['Baseline1700000000000']), /TIMESTAMP/);
  await assert.rejects(inspectGeneral(fakeClient([
    { name: 'CreateActivityLedger1792000000000', timestamp: '1792000000000' },
    { name: 'Baseline1700000000000', timestamp: '1700000000000' },
  ]), target, ['Baseline1700000000000', 'CreateActivityLedger1792000000000']), /HISTORY_ORDER/);
  await assert.rejects(inspectGeneral(fakeClient([], { db: 'wrong' }), target, []), /IDENTITY/);
});

test('target verification accepts both pg.Client and TypeORM QueryRunner result shapes', async () => {
  const pgClient = fakeClient([{ name: 'Baseline1700000000000', timestamp: '1700000000000' }]);
  const typeormRunner = fakeClient([{ name: 'Baseline1700000000000', timestamp: '1700000000000' }]);
  const originalQuery = typeormRunner.query;
  typeormRunner.query = async (...args) => {
    const result = await originalQuery(...args);
    return Array.isArray(result.rows) ? result.rows : result;
  };
  assert.deepEqual(
    (await inspectGeneral(pgClient, target, ['Baseline1700000000000'])).names,
    (await inspectGeneral(typeormRunner, target, ['Baseline1700000000000'])).names,
  );
});

test('wrong role and applied migrations are rejected or skipped without rerun', async () => {
  const client = fakeClient([]);
  client.query = async sql => {
    if (sql.includes('current_database() AS db')) return { rows: [{ db: target.database, role: 'wrong_role', address: target.host, port: target.port, oid: target.databaseOid, recovery: false }] };
    return fakeClient([]).query(sql);
  };
  await assert.rejects(inspectGeneral(client, target, []), /IDENTITY/);
  const applied = fakeClient([{ name: 'Baseline1700000000000', timestamp: '1700000000000' }]);
  const result = await inspectGeneral(applied, target, ['Baseline1700000000000']);
  assert.deepEqual(result.names, ['Baseline1700000000000']);
  assert.deepEqual(pendingMigrations(['Baseline1700000000000'], result.names), []);
});

test('confirmation remains bound to the general plan kind', () => {
  assert.notEqual(confirmation(target, 'digest', PLAN_KIND), confirmation(target, 'digest'));
  assert.equal(config(target, credential).user, target.migrationRole);
});

test('general release CLI suppresses credential-bearing connection failures', () => {
  const { spawnSync } = require('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-general-cli-'));
  try {
    const targetFile = path.join(dir, 'target.json');
    const planFile = path.join(dir, 'plan.json');
    fs.writeFileSync(targetFile, JSON.stringify(target));
    fs.writeFileSync(planFile, JSON.stringify({ version: 1, migrations: ['Baseline1700000000000'] }));
    const result = spawnSync(process.execPath, [path.join(__dirname, 'release-migrations.cjs'), 'verify', targetFile, planFile], {
      env: { PATH: process.env.PATH, LEDGER_MIGRATION_DATABASE_URL: 'postgresql://ledger_migrator:never-print@wrong.invalid:55469/ledger_local_20261110' },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert(!result.stderr.includes('never-print'));
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('compiled DAppGenius migrations receive a real QueryRunner surface', async () => {
  const calls = [];
  const runner = new Proxy({}, {
    get: (_target, property) => {
      if (property === 'query') return async () => { calls.push('query'); return []; };
      if (typeof property === 'string' && property !== 'then') {
        return async () => { calls.push(property); return undefined; };
      }
      return undefined;
    },
  });
  const rooms = require('../dist/shared/infra/typeorm/migrations/1657594775834-CreateOrganizationsRooms.js').CreateOrganizationsRooms1657594775834;
  const missingColumns = require('../dist/shared/infra/typeorm/migrations/1760610000000-AddMissingTransactionColumns.js').AddMissingTransactionColumns1760610000000;
  await new rooms().up(runner);
  await new missingColumns().up(runner);
  assert(calls.includes('createTable'));
  assert(calls.includes('createForeignKey'));
  assert(calls.includes('query'));
});

test('startup safety remains enforced by the existing release regression suite', () => {
  for (const file of ['backend/Procfile', 'backend/docker-compose.yaml', 'local-env/docker-compose.yml', 'local-env/backend-start.sh']) {
    assert.doesNotMatch(fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'), /migration:run/);
  }
});
