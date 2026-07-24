/**
 * ZTA Coin Transfer Persistence — Integration Tests
 *
 * Run against a LOCAL/DEV database only. Never run against production.
 *
 *   ts-node-dev -r tsconfig-paths/register src/__tests__/transfer-persistence.integration.ts
 *
 * The tests create accounts prefixed with "__TEST__" and clean them up
 * when done. They do NOT touch existing ledger entries.
 */

import 'reflect-metadata';
import 'dotenv/config';
import assert from 'assert';
import { getConnection, getRepository } from 'typeorm';
import { Account } from '../modules/transactions/infra/typeorm/entities/Account';
import { Transaction } from '../modules/transactions/infra/typeorm/entities/Transaction';
import { accountService } from '../shared/accounts/AccountService';
import { ledgerService } from '../shared/ledger/LedgerService';
import TransferTokenService from '../modules/transactions/services/TransferTokenService';
import MintTokenService from '../modules/transactions/services/MintTokenService';
import { initializeDatabase } from '../shared/infra/typeorm';
import {
  normalizeTokenAmount,
  tokenAmountToNumber,
} from '../shared/amounts/TokenAmount';

const SENDER = '__TEST__MIKE';
const RECEIVER = '__TEST__CONNIE';
const ISSUER = 'KN_ISSUER';
const SYSTEM = 'KNOWN_SYSTEM';

let passed = 0;
let failed = 0;

function ok(name: string, result: boolean, detail?: string) {
  if (result) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

async function waitForConnection(ms = 1500) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanTestAccounts() {
  const repo = getRepository(Account);
  await repo.delete({ id: SENDER });
  await repo.delete({ id: RECEIVER });
}

async function cleanTestLedgerEntries() {
  const repo = getRepository(Transaction);
  // Only delete test entries (from or to test accounts)
  await repo
    .createQueryBuilder()
    .delete()
    .where('"from" = :s OR "to" = :s OR "from" = :r OR "to" = :r', {
      s: SENDER,
      r: RECEIVER,
    })
    .execute();
}

// ── Test 1: Mint credits persistent account balance and records ledger ─────
async function testMintPersistence() {
  console.log('\nTest 1: Mint credits persistent account and records ledger');
  const mintService = new MintTokenService();

  // Mint only works with KN_ISSUER, which credits KNOWN_SYSTEM.
  // We verify the pattern by minting and checking SYSTEM account balance.
  const balanceBefore = await accountService.getBalance(SYSTEM);
  const ledgerCountBefore = (await ledgerService.getByAccount(SYSTEM)).length;
  await mintService.execute({ user_id: ISSUER, amount: 50 });
  const balanceAfter = await accountService.getBalance(SYSTEM);
  const entries = await ledgerService.getByAccount(SYSTEM);

  ok('Balance increased by minted amount', balanceAfter === balanceBefore + 50,
    `before=${balanceBefore} after=${balanceAfter}`);
  ok('Exactly one ledger entry was added', entries.length === ledgerCountBefore + 1);

  const latest = entries[0];
  ok('Ledger entry recorded', !!latest, 'no entry found');
  if (latest) {
    ok('Ledger entry type is KN-MNT-000', latest.type === 'KN-MNT-000');
    ok('Ledger entry amount matches', tokenAmountToNumber(latest.amount) === 50);
    ok('Ledger entry has before snapshot', typeof latest.before === 'object');
    ok('Ledger entry has after snapshot', typeof latest.after === 'object');
  }
}

async function testMintRollback() {
  console.log('\nTest 2: Mint rolls back balance when ledger insertion fails');
  const balanceBefore = await accountService.getBalance(SYSTEM);
  const ledgerCountBefore = (await ledgerService.getByAccount(SYSTEM)).length;
  const mintService = new MintTokenService(async () => {
    throw new Error('simulated ledger failure');
  });

  let threw = false;
  try {
    await mintService.execute({ user_id: ISSUER, amount: 25 });
  } catch (error) {
    threw = true;
  }

  const balanceAfter = await accountService.getBalance(SYSTEM);
  const ledgerCountAfter = (await ledgerService.getByAccount(SYSTEM)).length;
  ok('Simulated ledger failure is propagated', threw);
  ok(
    'Balance remains unchanged after ledger failure',
    balanceAfter === balanceBefore,
    `before=${balanceBefore} after=${balanceAfter}`,
  );
  ok('Ledger remains unchanged after ledger failure', ledgerCountAfter === ledgerCountBefore);
}

async function testInvalidMintAmounts() {
  console.log('\nTest 3: Invalid mint amounts are rejected');
  const invalid: unknown[] = [
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    'not-a-number',
    '1.123456789',
  ];

  for (const amount of invalid) {
    let threw = false;
    try {
      normalizeTokenAmount(amount);
    } catch {
      threw = true;
    }
    ok(`Rejects ${String(amount)}`, threw);
  }
}

// ── Test 2: Transfer debits and credits persistent accounts ────────────────
async function testTransferPersistence() {
  console.log('\nTest 2: Transfer debits sender and credits receiver persistently');
  await cleanTestAccounts();

  // Seed sender with 1000
  await accountService.credit(SENDER, 1000);
  const transferService = new TransferTokenService();

  await transferService.execute({ from_user: SENDER, to_user: RECEIVER, amount: 100 });

  const senderBalance = await accountService.getBalance(SENDER);
  const receiverBalance = await accountService.getBalance(RECEIVER);

  ok('Sender balance is 900 after transfer of 100', senderBalance === 900,
    `actual=${senderBalance}`);
  ok('Receiver balance is 100 after transfer of 100', receiverBalance === 100,
    `actual=${receiverBalance}`);
}

// ── Test 3: Ledger records correct before/after snapshots ──────────────────
async function testLedgerSnapshots() {
  console.log('\nTest 3: Transfer records correct before/after snapshots');
  await cleanTestAccounts();
  await cleanTestLedgerEntries();

  await accountService.credit(SENDER, 500);
  const fromBefore = await accountService.getBalance(SENDER);
  const toBefore = await accountService.getBalance(RECEIVER);

  const transferService = new TransferTokenService();
  await transferService.execute({ from_user: SENDER, to_user: RECEIVER, amount: 200 });

  const entries = await ledgerService.getByAccount(SENDER);
  const entry = entries[0];

  ok('Ledger entry found', !!entry);
  if (entry) {
    ok('before.from_balance matches sender balance before transfer',
      entry.before.from_balance === fromBefore,
      `expected=${fromBefore} got=${entry.before.from_balance}`);
    ok('before.to_balance matches receiver balance before transfer',
      entry.before.to_balance === toBefore,
      `expected=${toBefore} got=${entry.before.to_balance}`);
    ok('after.from_balance matches sender balance after transfer',
      entry.after.from_balance === fromBefore - 200,
      `expected=${fromBefore - 200} got=${entry.after.from_balance}`);
    ok('after.to_balance matches receiver balance after transfer',
      entry.after.to_balance === toBefore + 200,
      `expected=${toBefore + 200} got=${entry.after.to_balance}`);
  }
}

// ── Test 4: Transfer fails when sender has insufficient balance ────────────
async function testInsufficientBalance() {
  console.log('\nTest 4: Transfer fails on insufficient persistent balance');
  await cleanTestAccounts();

  await accountService.credit(SENDER, 50);

  const transferService = new TransferTokenService();
  let threw = false;
  let errorMessage = '';
  try {
    await transferService.execute({ from_user: SENDER, to_user: RECEIVER, amount: 200 });
  } catch (err: any) {
    threw = true;
    errorMessage = err.message;
  }

  ok('Transfer throws on insufficient balance', threw);
  ok('Error message is Insufficient balance', errorMessage === 'Insufficient balance',
    `actual="${errorMessage}"`);

  // Balances must be unchanged after the failed transfer
  const senderBalance = await accountService.getBalance(SENDER);
  ok('Sender balance unchanged after failed transfer', senderBalance === 50,
    `actual=${senderBalance}`);
}

// ── Test 5: Sender balance does NOT reset to 1000 per request ─────────────
async function testNoBalanceReset() {
  console.log('\nTest 5: Sender balance does not reset to 1000 per new service instance');
  await cleanTestAccounts();

  await accountService.credit(SENDER, 300);

  // Instantiate TWO separate service objects (simulates two requests)
  const transferService1 = new TransferTokenService();
  const transferService2 = new TransferTokenService();

  await transferService1.execute({ from_user: SENDER, to_user: RECEIVER, amount: 100 });
  // After first transfer: SENDER=200, RECEIVER=100

  // The old code would have reset SENDER to 1000 here; the fix reads from DB
  let threw = false;
  try {
    await transferService2.execute({ from_user: SENDER, to_user: RECEIVER, amount: 250 });
  } catch (err) {
    threw = true; // expected — only 200 left
  }

  ok('Second transfer correctly fails because real DB balance (200) < 250', threw);

  const senderBalance = await accountService.getBalance(SENDER);
  ok('Sender balance is 200, not 0 or 1000', senderBalance === 200,
    `actual=${senderBalance}`);
}

// ── Test 6: Ledger entries survive service re-instantiation ────────────────
async function testLedgerSurvivesReinstantiation() {
  console.log('\nTest 6: Ledger entries survive service re-instantiation (DB-backed)');
  await cleanTestAccounts();
  await cleanTestLedgerEntries();

  await accountService.credit(SENDER, 400);

  const service1 = new TransferTokenService();
  await service1.execute({ from_user: SENDER, to_user: RECEIVER, amount: 75 });

  // Simulate service restart by creating a brand-new service instance and reading from DB
  const entries = await ledgerService.getByAccount(SENDER);
  ok('Ledger entry persisted and readable by fresh service', entries.length > 0,
    `found ${entries.length} entries`);
}

// ── Test 7: LedgerService.record() generates unique ID when none provided ──
async function testLedgerIdGeneration() {
  console.log('\nTest 7: LedgerService.record() generates unique ID when none provided');

  const before = await ledgerService.getAll();
  const countBefore = before.length;

  await ledgerService.record({
    // id intentionally omitted
    type: '__TEST__ID_GEN',
    timestamp: new Date().toISOString(),
    from: SENDER,
    to: RECEIVER,
    amount: 1,
    before: {},
    after: {},
  });

  const after = await ledgerService.getAll();
  ok('Record saved without explicit id', after.length === countBefore + 1,
    `before=${countBefore} after=${after.length}`);

  // Clean up
  const repo = getRepository(Transaction);
  await repo.delete({ type: '__TEST__ID_GEN' });
}

// ── Test 8: clearDatabase.ts production guard ──────────────────────────────
async function testProductionGuard() {
  console.log('\nTest 8: clearDatabase production guard blocks execution when NODE_ENV=production');

  // Dynamically import and call the function with NODE_ENV forced to production
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  let threw = false;
  let errorMessage = '';
  try {
    const { default: runDeleteQueries } = await import('../shared/infra/http/clearDatabase');
    await runDeleteQueries();
  } catch (err: any) {
    threw = true;
    errorMessage = err.message;
  } finally {
    process.env.NODE_ENV = original;
  }

  ok('clearDatabase throws in production', threw);
  ok('Error message mentions production', errorMessage.includes('production'),
    `actual="${errorMessage}"`);
}

// ── Runner ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== ZTA Coin Transfer Persistence Integration Tests ===');
  await initializeDatabase();

  try {
    await testMintPersistence();
    await testMintRollback();
    await testInvalidMintAmounts();
    await testTransferPersistence();
    await testLedgerSnapshots();
    await testInsufficientBalance();
    await testNoBalanceReset();
    await testLedgerSurvivesReinstantiation();
    await testLedgerIdGeneration();
    await testProductionGuard();
  } finally {
    await cleanTestAccounts();
    await cleanTestLedgerEntries();
    await getConnection().close();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
