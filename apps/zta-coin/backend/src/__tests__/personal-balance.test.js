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

test('personal balance route rejects missing and invalid sessions', async () => {
  const express = require('express');
  const http = require('node:http');
  const { createPersonalBalanceRouter } = require('../modules/personalBalance/personalBalance.routes');
  const app = express();
  app.use('/me/balance', createPersonalBalanceRouter(
    new ZtaPersonalBalanceService({ getOrCreate: async () => ({ accountId: 'unused', balance: '0.00000000' }) }),
    async token => {
      if (token === 'zta1_valid') return { userId: '11111111-1111-4111-8111-111111111111' };
      if (token === 'zta1_unavailable') throw new Error('Authentication unavailable');
      throw new Error('Authentication required');
    },
  ));
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/me/balance`;
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await fetch(`${base}?user_id=22222222-2222-4222-8222-222222222222`, {
    headers: { Cookie: 'zta_session=zta1_valid' },
  })).status, 400);
  assert.equal((await fetch(base, { headers: { Cookie: 'zta_session=zta1_forged' } })).status, 401);
  assert.equal((await fetch(base, { headers: { Cookie: 'zta_session=zta1_unavailable' } })).status, 503);
  assert.equal((await fetch(base, { headers: { Cookie: 'zta_session=zta1_valid' } })).status, 200);
  await new Promise(resolve => server.close(resolve));
});
