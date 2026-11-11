'use strict';
// General, explicitly planned migration release. It never loads dotenv, ormconfig,
// application containers, or the web startup path.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createConnection } = require('typeorm');
const {
  config,
  pin,
  confirmation,
  ReleaseError,
} = require('./release-ledger.cjs');

const ROOT = path.resolve(__dirname, '..');
const PLAN_KIND = 'DAppGeniusMigrationsV1';
const check = (ok, code) => {
  if (!ok) throw new ReleaseError(code);
};

// pg.Client.query returns { rows, rowCount }; TypeORM's PostgreSQL
// QueryRunner.query returns the rows array unless structured results are
// explicitly requested. Accept both forms for verification.
function queryRows(result) {
  if (Array.isArray(result)) return result;
  check(result && Array.isArray(result.rows), 'UNEXPECTED_QUERY_RESULT_SHAPE');
  return result.rows;
}

function migrationFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter(file => /^\d{13}-.+\.js$/.test(file))
    .sort();
}

function loadMigrations(directory) {
  const files = migrationFiles(directory);
  const migrations = new Map();
  for (const file of files) {
    const exported = Object.values(require(path.join(directory, file)));
    const migration = exported.find(
      value => typeof value === 'function' && /\d{13}$/.test(value.name),
    );
    check(migration, 'INVALID_MIGRATION_ARTIFACT');
    check(migration.name.slice(-13) === file.slice(0, 13), 'MIGRATION_FILE_NAME_MISMATCH');
    check(!migrations.has(migration.name), 'DUPLICATE_MIGRATION_NAME');
    migrations.set(migration.name, { file, Migration: migration });
  }
  return { files, migrations };
}

function readPlan(planFile, migrations) {
  let plan;
  try {
    plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  } catch {
    throw new ReleaseError('INVALID_MIGRATION_PLAN');
  }
  check(plan && plan.version === 1 && Array.isArray(plan.migrations), 'INVALID_MIGRATION_PLAN');
  check(plan.migrations.length > 0, 'EMPTY_MIGRATION_PLAN');
  let previous = 0;
  const names = new Set();
  for (const name of plan.migrations) {
    check(
      typeof name === 'string' && /^[A-Za-z0-9_]+\d{13}$/.test(name),
      'INVALID_MIGRATION_NAME',
    );
    check(!names.has(name), 'DUPLICATE_PLANNED_MIGRATION');
    check(migrations.has(name), 'UNAPPROVED_MIGRATION');
    const timestamp = Number(name.slice(-13));
    check(timestamp > previous, 'MIGRATION_ORDER_INVALID');
    previous = timestamp;
    names.add(name);
  }
  return plan.migrations;
}

function validatePlanCoverage(plan, migrations) {
  check([...migrations.keys()].every(name => plan.includes(name)), 'UNAPPROVED_MIGRATION');
}

function pendingMigrations(plan, appliedNames) {
  return plan.filter(name => !appliedNames.includes(name));
}

function digest(files, directory, planFile) {
  const hash = crypto.createHash('sha256');
  hash.update(PLAN_KIND).update(fs.readFileSync(planFile));
  for (const file of files) hash.update(file).update(fs.readFileSync(path.join(directory, file)));
  return hash.digest('hex');
}

async function inspectGeneral(client, target, expected) {
  const [identity] = queryRows(await client.query(`SELECT current_database() AS db, current_user AS role,
    host(inet_server_addr()) AS address, inet_server_port() AS port,
    (SELECT oid::int FROM pg_database WHERE datname=current_database()) AS oid,
    pg_is_in_recovery() AS recovery`));
  check(
    identity.db === target.database && identity.role === target.migrationRole &&
      identity.port === target.port && identity.oid === target.databaseOid &&
      target.addresses.includes(identity.address) && !identity.recovery,
    'SERVER_IDENTITY_MISMATCH',
  );
  const roles = queryRows(await client.query(`SELECT rolname, rolsuper, rolcreatedb, rolcreaterole,
    rolreplication, rolbypassrls FROM pg_roles WHERE rolname = ANY($1::text[])`,
    [[target.migrationRole, target.runtimeRole]]));
  check(roles.length === 2 && roles.every(role =>
    !role.rolsuper && !role.rolcreatedb && !role.rolcreaterole &&
    !role.rolreplication && !role.rolbypassrls), 'UNSAFE_ROLE_ATTRIBUTES');
  const [runtime] = queryRows(await client.query(`SELECT
    pg_has_role($1,$2,'MEMBER') AS owner_member,
    has_schema_privilege($1,'public','CREATE') AS can_create,
    pg_has_role($1,(SELECT datdba FROM pg_database WHERE datname=current_database()),'MEMBER') AS db_owner`,
    [target.runtimeRole, target.migrationRole]));
  check(!runtime.owner_member && !runtime.can_create && !runtime.db_owner, 'UNSAFE_RUNTIME_ROLE');
  const reachable = queryRows(await client.query(`SELECT r.rolname FROM pg_roles r
    WHERE pg_has_role($1,r.oid,'MEMBER') AND (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
      OR r.rolreplication OR r.rolbypassrls OR has_schema_privilege(r.oid,'public','CREATE')
      OR r.rolname IN ('pg_write_all_data','pg_write_server_files','pg_read_server_files','pg_execute_server_program'))`,
    [target.runtimeRole]));
  check(reachable.length === 0, 'UNSAFE_ASSUMABLE_RUNTIME_ROLE');
  const ext = queryRows(await client.query("SELECT 1 FROM pg_extension WHERE extname='uuid-ossp' AND extnamespace='public'::regnamespace"));
  check(ext.length === 1, 'PUBLIC_UUID_EXTENSION_REQUIRED');
  const history = queryRows(await client.query('SELECT name, timestamp::text FROM public.migrations ORDER BY id'));
  const names = history.map(row => row.name);
  check(new Set(names).size === names.length && names.every(name => expected.includes(name)), 'UNREVIEWED_MIGRATION_HISTORY');
  check(history.every(row => row.timestamp === row.name.slice(-13)), 'MIGRATION_TIMESTAMP_MISMATCH');
  let previousTimestamp = 0;
  check(history.every(row => {
    const timestamp = Number(row.timestamp);
    const ordered = Number.isSafeInteger(timestamp) && timestamp > previousTimestamp;
    previousTimestamp = timestamp;
    return ordered;
  }), 'MIGRATION_HISTORY_ORDER_INVALID');
  return { history, names };
}

async function releaseMigrations({ mode, target, planFile, credential, confirmed,
  env = process.env, lookup, Connection = createConnection,
  directory = path.join(ROOT, 'dist/shared/infra/typeorm/migrations'), log = console.log }) {
  check(mode === 'verify' || mode === 'migrate', 'INVALID_MODE');
  const options = config(target, credential, env);
  const host = await pin(target, lookup);
  const { files, migrations } = loadMigrations(directory);
  const plan = readPlan(planFile, migrations);
  validatePlanCoverage(plan, migrations);
  const expected = [...migrations.keys()];
  const pending = expected.filter(name => !plan.includes(name));
  check(pending.length === 0, 'UNAPPROVED_MIGRATION');
  const token = confirmation(target, digest(files, directory, planFile), PLAN_KIND);
  if (mode === 'migrate') check(confirmed === token, 'EXPLICIT_TARGET_CONFIRMATION_REQUIRED');
  // Use TypeORM's real PostgreSQL QueryRunner so migrations can use schema
  // helpers (createTable, addColumn, createForeignKey, indexes, etc.).
  // This connection is still created against the DNS-pinned host and never
  // loads ormconfig or application providers.
  const connection = await Connection({
    name: 'dappgenius-migration-release',
    type: 'postgres',
    host,
    port: options.port,
    username: options.user,
    password: options.password,
    database: options.database,
    ssl: options.ssl,
    options: options.options,
    applicationName: options.application_name,
    connectionTimeoutMillis: options.connectionTimeoutMillis,
    extra: { query_timeout: options.query_timeout },
    synchronize: false,
    migrationsRun: false,
    migrations: [],
    entities: [],
    logging: false,
  });
  const queryRunner = connection.createQueryRunner();
  let transaction = false;
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();
    transaction = true;
    await queryRunner.query('SET TRANSACTION READ ONLY');
    const first = await inspectGeneral(queryRunner, target, expected);
    const missing = pendingMigrations(plan, first.names);
    check(first.names.every(name => expected.includes(name)), 'UNREVIEWED_MIGRATION_HISTORY');
    await queryRunner.commitTransaction();
    transaction = false;
    if (mode === 'verify') {
      log(`Migration target and plan verified. Confirmation: ${token}`);
      return;
    }
    await queryRunner.startTransaction();
    transaction = true;
    await queryRunner.query('SELECT pg_advisory_xact_lock(1792000000, 2)');
    const locked = await inspectGeneral(queryRunner, target, expected);
    for (const name of plan) {
      if (locked.names.includes(name)) continue;
      const { Migration } = migrations.get(name);
      await new Migration().up(queryRunner);
      await queryRunner.query('INSERT INTO public.migrations(timestamp,name) VALUES($1,$2)', [name.slice(-13), name]);
      locked.names.push(name);
    }
    await inspectGeneral(queryRunner, target, expected);
    await queryRunner.commitTransaction();
    transaction = false;
    log(missing.length ? `Applied ${missing.length} approved migration(s).` : 'All approved migrations already applied; no migration executed.');
  } finally {
    if (transaction) await queryRunner.rollbackTransaction().catch(() => {});
    await queryRunner.release().catch(() => {});
    await connection.close().catch(() => {});
  }
}

async function main(args = process.argv.slice(2)) {
  check(process.versions.node.split('.')[0] === '22', 'NODE_22_REQUIRED');
  const [mode, targetFile, planFile, confirmed] = args;
  check(args.length === (mode === 'migrate' ? 4 : 3), 'USAGE_MODE_TARGET_PLAN_CONFIRMATION');
  let target;
  try { target = JSON.parse(fs.readFileSync(targetFile, 'utf8')); } catch { throw new ReleaseError('INVALID_MANIFEST'); }
  await releaseMigrations({ mode, target, planFile, confirmed, credential: process.env.LEDGER_MIGRATION_DATABASE_URL });
}
if (require.main === module) main().catch(error => {
  console.error(error instanceof ReleaseError ? error.message : 'RELEASE_FAILED: diagnostics suppressed.');
  process.exitCode = 1;
});
module.exports = { migrationFiles, loadMigrations, readPlan, validatePlanCoverage, pendingMigrations, digest, inspectGeneral, releaseMigrations, PLAN_KIND };
