'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createConnection } = require('typeorm');
const {
  inspectGeneral,
  releaseMigrations,
  migrationFiles,
  digest,
  PLAN_KIND,
} = require('./release-migrations.cjs');
const { confirmation } = require('./release-ledger.cjs');

const enabled = Boolean(process.env.RELEASE_PG_PORT);
test('fresh localhost PostgreSQL: QueryRunner verification, helper migration, history, rerun, rollback', { skip: !enabled }, async () => {
  const host = process.env.RELEASE_PG_HOST || '127.0.0.1';
  const port = Number(process.env.RELEASE_PG_PORT);
  const database = process.env.RELEASE_PG_DATABASE;
  const migrationRole = process.env.RELEASE_PG_OWNER;
  const runtimeRole = process.env.RELEASE_PG_RUNTIME;
  const password = process.env.RELEASE_PG_PASSWORD;
  const databaseOid = Number(process.env.RELEASE_PG_OID);
  const target = {
    version: 1, host, port, database, databaseOid, migrationRole, runtimeRole,
    addresses: [host], tls: 'local-only',
  };
  const connection = await createConnection({
    type: 'postgres', host, port, username: migrationRole, password, database,
    synchronize: false, migrationsRun: false, entities: [], migrations: [], logging: false,
  });
  const runner = connection.createQueryRunner();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dappgenius-release-pg-'));
  try {
    await runner.connect();
    const verified = await inspectGeneral(runner, target, ['Baseline1700000000000']);
    assert.deepEqual(verified.names, ['Baseline1700000000000']);

    await runner.startTransaction();
    const { CreateConfigsTable1639356388757 } = require('../dist/shared/infra/typeorm/migrations/1639356388757-CreateConfigsTable.js');
    await new CreateConfigsTable1639356388757().up(runner);
    assert.equal((await runner.query("SELECT to_regclass('public.configs') AS name"))[0].name, 'configs');
    await runner.rollbackTransaction();
    assert.equal((await runner.query("SELECT to_regclass('public.configs') AS name"))[0].name, null);

    fs.writeFileSync(path.join(temp, '1700000000000-Baseline.js'), `class Baseline1700000000000 { async up() {} } module.exports = { Baseline1700000000000 };`);
    const typeormPath = JSON.stringify(require.resolve('typeorm'));
    fs.writeFileSync(path.join(temp, '1793000000000-CreateDisposable.js'), `const { Table } = require(${typeormPath}); class CreateDisposable1793000000000 { async up(q) { await q.createTable(new Table({ name: 'release_runner_probe', columns: [{ name: 'id', type: 'integer', isPrimary: true }] })); } } module.exports = { CreateDisposable1793000000000 };`);
    const planFile = path.join(temp, 'plan.json');
    fs.writeFileSync(planFile, JSON.stringify({ version: 1, migrations: ['Baseline1700000000000', 'CreateDisposable1793000000000'] }));
    const files = migrationFiles(temp);
    const token = confirmation(target, digest(files, temp, planFile), PLAN_KIND);
    const credential = `postgresql://${encodeURIComponent(migrationRole)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    const params = { mode: 'migrate', target, planFile, credential, confirmed: token, directory: temp, log: () => {} };
    await releaseMigrations(params);
    assert.equal((await runner.query("SELECT to_regclass('public.release_runner_probe') AS name"))[0].name, 'release_runner_probe');
    assert.equal((await runner.query("SELECT count(*)::int AS count FROM public.migrations WHERE name = 'CreateDisposable1793000000000'"))[0].count, 1);
    await releaseMigrations(params); // completed migration must be skipped, not rerun
    assert.equal((await runner.query("SELECT count(*)::int AS count FROM public.migrations WHERE name = 'CreateDisposable1793000000000'"))[0].count, 1);
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction().catch(() => {});
    await runner.query('DROP TABLE IF EXISTS public.release_runner_probe').catch(() => {});
    await runner.release().catch(() => {});
    await connection.close().catch(() => {});
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
