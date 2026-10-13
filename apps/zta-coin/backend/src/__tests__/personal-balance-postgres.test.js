const assert = require('node:assert/strict');
const test = require('node:test');
const { createConnection } = require('typeorm');
const { CreateZtaPersonalAccounts1762000002000 } = require('../shared/infra/typeorm/zta-migrations/1762000002000-CreateZtaPersonalAccounts');
const { PostgresPersonalBalanceStore } = require('../modules/personalBalance/ZtaPersonalBalanceService');

const run = process.env.RUN_ZTA_PERSONAL_PG === '1' ? test : test.skip;
let db;

run('personal account migration and concurrent provisioning', async () => {
  db = await createConnection({
    name: 'zta-personal-test', type: 'postgres', host: process.env.ZTA_PG_SOCKET || '/private/tmp/zta-personal-balance-pg',
    port: Number(process.env.ZTA_PG_PORT || 55440), username: 'zta_personal_test', database: 'zta_personal_test', logging: false,
  });
  const runner = db.createQueryRunner();
  const migration = new CreateZtaPersonalAccounts1762000002000();
  await migration.up(runner);
  const store = new PostgresPersonalBalanceStore(() => db);
  const userA = '11111111-1111-4111-8111-111111111111';
  const [one, two] = await Promise.all([store.getOrCreate(userA), store.getOrCreate(userA)]);
  assert.deepEqual(one, two);
  assert.equal(one.balance, '0.00000000');
  const userB = '22222222-2222-4222-8222-222222222222';
  const other = await store.getOrCreate(userB);
  assert.notEqual(one.accountId, other.accountId);
  await db.query(`UPDATE zta_personal_accounts SET balance = 12.34000000 WHERE dapp_user_id = $1`, [userA]);
  assert.equal((await store.getOrCreate(userA)).balance, '12.34000000');
  const rows = await db.query('SELECT COUNT(*)::int AS count FROM zta_personal_accounts');
  assert.equal(rows[0].count, 2);
  await migration.down(runner);
  await runner.release();
  await db.close();
  db = undefined;
});
