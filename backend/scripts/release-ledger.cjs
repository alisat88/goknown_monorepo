'use strict';
// Deliberately does NOT load dotenv, ormconfig, or application containers.
const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns').promises;
const net = require('node:net');
const crypto = require('node:crypto');
const NAME = 'CreateActivityLedger1792000000000';
const FILE = '1792000000000-CreateActivityLedger.js';
const ROOT = path.resolve(__dirname, '..');
class ReleaseError extends Error {}
const check = (ok, code) => {
  if (!ok) throw new ReleaseError(code);
};
const identifier = s =>
  typeof s === 'string' && /^[a-z_][a-z0-9_]{0,62}$/.test(s);
const loopback = ip => ip === '127.0.0.1' || ip === '::1';
function config(target, credential, env = {}) {
  check(target && target.version === 1, 'INVALID_MANIFEST');
  check(
    typeof target.host === 'string' && /^[a-zA-Z0-9.:-]+$/.test(target.host),
    'INVALID_HOST',
  );
  check(
    Number.isInteger(target.port) && target.port > 0 && target.port <= 65535,
    'INVALID_PORT',
  );
  check(
    identifier(target.database) &&
      identifier(target.ledgerSchema || 'activity_ledger') &&
      identifier(target.migrationRole) &&
      identifier(target.runtimeRole) &&
      identifier(target.applicationRole || 'goknown_app'),
    'INVALID_IDENTIFIERS',
  );
  check(target.migrationRole !== target.runtimeRole, 'ROLES_MUST_DIFFER');
  check(
    (target.applicationRole || 'goknown_app') !== target.migrationRole &&
      (target.applicationRole || 'goknown_app') !== target.runtimeRole,
    'ROLES_MUST_DIFFER',
  );
  check(
    Number.isInteger(target.databaseOid) && target.databaseOid > 0,
    'DATABASE_OID_REQUIRED',
  );
  check(
    Array.isArray(target.addresses) &&
      target.addresses.length > 0 &&
      target.addresses.every(x => net.isIP(x)),
    'PINNED_ADDRESSES_REQUIRED',
  );
  check(
    !env.DATABASE_URL && !env.PGOPTIONS && !env.PGSERVICE,
    'REMOVE_AMBIENT_DATABASE_CONFIGURATION',
  );
  let url;
  try {
    url = new URL(credential);
  } catch {
    throw new ReleaseError('MIGRATION_CREDENTIAL_REQUIRED');
  }
  check(
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
      !url.search &&
      !url.hash,
    'INVALID_CREDENTIAL_URL',
  );
  const user = decodeURIComponent(url.username);
  const database = decodeURIComponent(url.pathname.slice(1));
  check(
    url.hostname.replace(/^\[|\]$/g, '') === target.host &&
      Number(url.port || 5432) === target.port &&
      database === target.database &&
      user === target.migrationRole,
    'CREDENTIAL_TARGET_MISMATCH',
  );
  check(url.password.length > 0, 'PASSWORD_REQUIRED');
  const local = loopback(target.host) && target.addresses.every(loopback);
  check(
    target.tls === 'verify-full' || (local && target.tls === 'local-only'),
    'VERIFIED_TLS_REQUIRED',
  );
  check(
    target.tls !== 'verify-full' || typeof target.caFile === 'string',
    'CA_FILE_REQUIRED',
  );
  const ledgerSchema = target.ledgerSchema || 'activity_ledger';
  const applicationRole = target.applicationRole || 'goknown_app';
  return {
    user,
    password: decodeURIComponent(url.password),
    database,
    port: target.port,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
    application_name: 'dappgenius-ledger-release',
    options:
      `-c search_path=public,${ledgerSchema},pg_catalog -c statement_timeout=30000 -c lock_timeout=5000`,
    ledgerSchema,
    applicationRole,
    ssl:
      target.tls === 'verify-full'
        ? {
            rejectUnauthorized: true,
            servername: target.host,
            ca: fs.readFileSync(target.caFile, 'utf8'),
          }
        : false,
  };
}
async function pin(target, lookup = dns.lookup) {
  const resolved = net.isIP(target.host)
    ? [{ address: target.host }]
    : await lookup(target.host, { all: true });
  check(
    resolved.length > 0 &&
      resolved.every(x => target.addresses.includes(x.address)),
    'DNS_TARGET_MISMATCH',
  );
  return resolved[0].address; // Connection uses this verified IP, not a second DNS lookup.
}
function confirmation(target, digest, migration = NAME) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ target, digest, migration }))
    .digest('hex');
}
async function inspect(client, target, expected) {
  const ledgerSchema = target.ledgerSchema || 'activity_ledger';
  const ledgerIndex = expected.indexOf(NAME);
  check(ledgerIndex >= 0, 'BUILD_REQUIRED');
  const {
    rows: [id],
  } = await client.query(`SELECT current_database() AS db, current_user AS role,
    host(inet_server_addr()) AS address, inet_server_port() AS port,
    (SELECT oid::int FROM pg_database WHERE datname=current_database()) AS oid,
    pg_is_in_recovery() AS recovery`);
  check(
    id.db === target.database &&
      id.role === target.migrationRole &&
      id.port === target.port &&
      id.oid === target.databaseOid &&
      target.addresses.includes(id.address) &&
      !id.recovery,
    'SERVER_IDENTITY_MISMATCH',
  );
  const roles = (
    await client.query(
      `SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
    FROM pg_roles WHERE rolname = ANY($1::text[])`,
      [[target.migrationRole, target.runtimeRole, target.applicationRole || 'goknown_app']],
    )
  ).rows;
  check(
    roles.length === 3 &&
      roles.every(
        r =>
          !r.rolsuper &&
          !r.rolcreatedb &&
          !r.rolcreaterole &&
          !r.rolreplication &&
          !r.rolbypassrls,
      ),
    'UNSAFE_ROLE_ATTRIBUTES',
  );
  const {
    rows: [role],
  } = await client.query(
    `SELECT
    pg_has_role($1,$2,'MEMBER') AS owner_member,
    has_schema_privilege($1,'public','CREATE') AS can_create,
    pg_has_role($1,(SELECT datdba FROM pg_database WHERE datname=current_database()),'MEMBER') AS db_owner`,
    [target.runtimeRole, target.migrationRole],
  );
  check(
    !role.owner_member && !role.can_create && !role.db_owner,
    'UNSAFE_RUNTIME_ROLE',
  );
  const reachable = await client.query(
    `SELECT r.rolname FROM pg_roles r
    WHERE pg_has_role($1,r.oid,'MEMBER') AND (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
      OR r.rolreplication OR r.rolbypassrls OR has_schema_privilege(r.oid,'public','CREATE')
      OR r.rolname IN ('pg_write_all_data','pg_write_server_files','pg_read_server_files','pg_execute_server_program'))`,
    [target.runtimeRole],
  );
  check(reachable.rows.length === 0, 'UNSAFE_ASSUMABLE_RUNTIME_ROLE');
  const ext = await client.query(
    "SELECT 1 FROM pg_extension WHERE extname='uuid-ossp' AND extnamespace='public'::regnamespace",
  );
  check(ext.rowCount === 1, 'PUBLIC_UUID_EXTENSION_REQUIRED');
  const history = (
    await client.query(
      'SELECT name, timestamp::text FROM public.migrations ORDER BY id',
    )
  ).rows;
  const names = history.map(r => r.name);
  check(
    new Set(names).size === names.length &&
      names.every(n => expected.includes(n)),
    'UNREVIEWED_MIGRATION_HISTORY',
  );
  check(
    expected.slice(0, ledgerIndex).every(n => names.includes(n)),
    'BASELINE_MIGRATIONS_MISSING',
  );
  check(
    expected.slice(ledgerIndex + 1).every(n => !names.includes(n)),
    'UNREVIEWED_NEWER_MIGRATIONS',
  );
  check(
    history.every(r => r.timestamp === r.name.slice(-13)),
    'MIGRATION_TIMESTAMP_MISMATCH',
  );
  const objects = (
    await client.query(
      `SELECT c.relname, r.rolname AS owner FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner
    WHERE n.nspname=$1 AND c.relname = ANY($2::text[])`,
      [ledgerSchema, ['activity_events', 'activity_access_sessions']],
    )
  ).rows;
  const applied = names.includes(NAME);
  if (applied) {
    const applicationRole = target.applicationRole || 'goknown_app';
    const {
      rows: [application],
    } = await client.query(
      `SELECT CASE WHEN to_regnamespace($2) IS NULL THEN false ELSE has_schema_privilege($1,$2,'USAGE,CREATE') END AS ledger_schema_access,
        has_table_privilege($1,$3,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS event_access,
        has_table_privilege($1,$4,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS session_access,
        CASE WHEN to_regclass($5) IS NULL THEN false ELSE has_table_privilege($1,$5,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') END AS viewer_access`,
      [applicationRole, ledgerSchema, `${ledgerSchema}.activity_events`, `${ledgerSchema}.activity_access_sessions`, `${ledgerSchema}.activity_log_viewers`],
    );
    check(
      !application.ledger_schema_access && !application.event_access &&
        !application.session_access && !application.viewer_access,
      'APPLICATION_ROLE_CAN_ACCESS_LEDGER',
    );
  }
  check(
    applied
      ? objects.length === 2 &&
          objects.every(r => r.owner === target.migrationRole)
      : objects.length === 0,
    'LEDGER_STATE_OR_OWNER_MISMATCH',
  );
  if (applied) {
    const trigger = await client.query(
      `SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
      WHERE t.tgrelid=$1::regclass AND t.tgname='activity_events_no_mutation'
      AND t.tgenabled IN ('O','A') AND t.tgtype=58 AND p.proname='reject_activity_event_mutation'
      AND p.proowner=(SELECT oid FROM pg_roles WHERE rolname=$2)`,
      [`${ledgerSchema}.activity_events`, target.migrationRole],
    );
    check(trigger.rowCount === 1, 'LEDGER_TRIGGER_MISMATCH');
    const indexes =
      await client.query(`SELECT c.relname FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
      WHERE i.indrelid IN ($1::regclass,$2::regclass)
        AND i.indisvalid AND i.indisready`, [
        `${ledgerSchema}.activity_events`,
        `${ledgerSchema}.activity_access_sessions`,
      ]);
    const requiredIndexes = [
      'activity_access_sessions_pkey',
      'activity_access_sessions_actor_user_id_request_id_key',
      'activity_sessions_expiry',
      'activity_events_pkey',
      'activity_events_access_session_id_sequence_key',
      'activity_events_actor_time',
      'activity_events_asset_time',
      'activity_events_one_end',
    ];
    check(
      requiredIndexes.every(name =>
        indexes.rows.some(row => row.relname === name),
      ),
      'LEDGER_INDEX_MISMATCH',
    );
  }
  return applied;
}
async function release({
  mode,
  target,
  credential,
  confirmed,
  env = process.env,
  Client,
  lookup,
  directory = path.join(ROOT, 'dist/shared/infra/typeorm/migrations'),
  log = console.log,
}) {
  check(mode === 'verify' || mode === 'migrate', 'INVALID_MODE');
  const options = config(target, credential, env);
  const host = await pin(target, lookup);
  const files = fs
    .readdirSync(directory)
    .filter(f => /^\d{13}-.+\.js$/.test(f))
    .sort();
  check(files.includes(FILE), 'BUILD_REQUIRED');
  // Load only reviewed compiled migrations; never application startup/providers.
  const expected = files.map(file => {
    const exports = Object.values(require(path.join(directory, file)));
    const migration = exports.find(
      x => typeof x === 'function' && /\d{13}$/.test(x.name),
    );
    check(migration, 'INVALID_MIGRATION_ARTIFACT');
    return migration.name;
  });
  const digest = crypto.createHash('sha256');
  for (const file of files)
    digest.update(file).update(fs.readFileSync(path.join(directory, file)));
  const token = confirmation(target, digest.digest('hex'));
  if (mode === 'migrate')
    check(confirmed === token, 'EXPLICIT_TARGET_CONFIRMATION_REQUIRED');
  const PgClient = Client || require('pg').Client;
  const client = new PgClient({ ...options, host });
  let transaction = false;
  // Suppress raw asynchronous connection errors too; subsequent queries fail closed.
  client.on?.('error', () => {});
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    transaction = true;
    await inspect(client, target, expected);
    await client.query('COMMIT');
    transaction = false;
    if (mode === 'verify') {
      log(`Target and baseline verified. Confirmation: ${token}`);
      return;
    }
    await client.query('BEGIN');
    transaction = true;
    await client.query('SELECT pg_advisory_xact_lock(1792000000, 1)');
    const applied = await inspect(client, target, expected); // Same verified connection, after release lock.
    if (!applied) {
      const Migration = require(path.join(directory, FILE))[NAME];
      await new Migration().up({
        query: (sql, params) => client.query(sql, params),
      });
      await client.query(
        'INSERT INTO public.migrations(timestamp,name) VALUES($1,$2)',
        ['1792000000000', NAME],
      );
      await inspect(client, target, expected);
    }
    await client.query('COMMIT');
    transaction = false;
    log(
      applied
        ? 'Ledger already applied; no migration executed.'
        : 'Ledger migration committed; apply reviewed runtime grants before enabling capture.',
    );
  } finally {
    if (transaction) await client.query('ROLLBACK').catch(() => {});
    await client.end().catch(() => {});
  }
}
async function main(args = process.argv.slice(2)) {
  check(process.versions.node.split('.')[0] === '22', 'NODE_22_REQUIRED');
  const [mode, file, confirmed] = args;
  check(
    args.length === (mode === 'migrate' ? 3 : 2),
    'USAGE_MODE_TARGET_FILE_CONFIRMATION',
  );
  const target = JSON.parse(fs.readFileSync(file, 'utf8'));
  await release({
    mode,
    target,
    confirmed,
    credential: process.env.LEDGER_MIGRATION_DATABASE_URL,
  });
}
if (require.main === module)
  main().catch(error => {
    // Never print raw pg/TLS/URL errors, SQL, process.env or stacks (may contain credentials).
    console.error(
      error instanceof ReleaseError
        ? error.message
        : 'RELEASE_FAILED: inspect the target and approved database diagnostics; credentials suppressed.',
    );
    process.exitCode = 1;
  });
module.exports = {
  config,
  pin,
  confirmation,
  inspect,
  release,
  ReleaseError,
  NAME,
};
