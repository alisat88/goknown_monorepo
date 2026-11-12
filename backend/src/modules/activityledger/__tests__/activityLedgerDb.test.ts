import { getActivityLedgerManager } from '../activityLedgerDb';

describe('isolated activity ledger connection', () => {
  const original = process.env.ACTIVITY_LEDGER_DATABASE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.ACTIVITY_LEDGER_DATABASE_URL;
    else process.env.ACTIVITY_LEDGER_DATABASE_URL = original;
  });

  test('fails closed when the dedicated connection is not configured', async () => {
    delete process.env.ACTIVITY_LEDGER_DATABASE_URL;
    await expect(getActivityLedgerManager()).rejects.toThrow(
      'ACTIVITY_LEDGER_DATABASE_URL is required',
    );
  });

  test('rejects URL query options that could override connection policy', async () => {
    process.env.ACTIVITY_LEDGER_DATABASE_URL =
      'postgresql://ledger:synthetic@127.0.0.1:55447/activity_ledger_test?sslmode=disable';
    await expect(getActivityLedgerManager()).rejects.toThrow(
      'Invalid activity ledger database URL',
    );
  });
});
