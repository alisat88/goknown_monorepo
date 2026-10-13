const assert = require('node:assert/strict');
const test = require('node:test');
const { ZtaPersonalBalanceService } = require('../modules/personalBalance/ZtaPersonalBalanceService');

test('personal balance service provisions from authenticated identity only', async () => {
  const calls = [];
  const service = new ZtaPersonalBalanceService({
    async getOrCreate(userId) {
      calls.push(userId);
      return { accountId: `personal:${userId}`, balance: '0.00000000' };
    },
  });
  const userId = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(await service.getBalance(userId), {
    accountId: `personal:${userId}`,
    balance: '0.00000000',
  });
  assert.deepEqual(calls, [userId]);
});

test('personal balance route rejects missing and invalid sessions', async t => {
  const express = require('express');
  const http = require('node:http');
  const { createPersonalBalanceRouter } = require('../modules/personalBalance/personalBalance.routes');
  const app = express();
  app.use('/me/balance', createPersonalBalanceRouter(
    new ZtaPersonalBalanceService({ getOrCreate: async () => ({ accountId: 'unused', balance: '0.00000000' }) }),
    async token => {
      if (token === 'zta1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') return { userId: '11111111-1111-4111-8111-111111111111' };
      if (token === 'zta1_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC') throw new Error('Authentication unavailable');
      throw new Error('Authentication required');
    },
  ));
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/me/balance`;
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await fetch(`${base}?user_id=22222222-2222-4222-8222-222222222222`, {
    headers: { Cookie: 'zta_session=zta1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  })).status, 400);
  assert.equal((await fetch(base, { headers: { Cookie: 'zta_session=zta1_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' } })).status, 401);
  assert.equal((await fetch(base, { headers: { Cookie: 'zta_session=zta1_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' } })).status, 503);
  assert.equal((await fetch(base, { headers: { Cookie: 'zta_session=zta1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' } })).status, 200);
  for (const value of ['%', '%GG', '%E0%A4%A', '%00', '', 'forged', 'zta1_short']) {
    const response = await fetch(base, { headers: { Cookie: `zta_session=${value}` } });
    assert.equal(response.status, 401, value);
    assert.deepEqual(await response.json(), { error: 'Authentication required' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const duplicate = await fetch(base, { headers: { Cookie: `zta_session=zta1_${'A'.repeat(43)}; zta_session=zta1_${'A'.repeat(43)}` } });
  assert.equal(duplicate.status, 401);
});
