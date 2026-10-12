const assert = require('node:assert/strict');
const test = require('node:test');

const { ZtaHandoffService, ZtaHandoffError } = require('../modules/auth/ZtaHandoffService');

const config = {
  dappRedeemUrl: 'http://dapp.test/strict-sessions/handoff/redeem',
  dappValidateUrl: 'http://dapp.test/strict-sessions/handoff/validate-parent',
  serviceToken: 'service-secret',
  clientId: 'zta-web',
  redirectUri: 'https://zta.test/callback',
};

function store() {
  let record;
  let transaction;
  return {
    async create(value) { record = value; },
    async createTransaction(value) { transaction = value; },
    async consumeTransaction(input) {
      if (!transaction || transaction.consumed_at || transaction.state_hash !== input.stateHash || transaction.verifier_hash !== input.verifierHash) return false;
      transaction.consumed_at = new Date();
      return true;
    },
    async findActive() { return record; },
    async revoke() { record.revoked_at = new Date(); },
    get record() { return record; },
    get transaction() { return transaction; },
  };
}

function http(valid = true) {
  return {
    async post(url, body, options) {
      assert.equal(options.headers['X-ZTA-Handoff-Token'], config.serviceToken);
      if (url === config.dappRedeemUrl) {
        assert.equal(body.client_id, config.clientId);
        return { data: { userId: '11111111-1111-4111-8111-111111111111', parentSessionHash: 'a'.repeat(64) } };
      }
      assert.equal(url, config.dappValidateUrl);
      return { data: { valid } };
    },
  };
}

test('redeem creates an opaque ZTA session and never stores the raw token', async () => {
  const sessions = store();
  const service = new ZtaHandoffService(sessions, http(), config);
  const transaction = await service.startTransaction();
  const result = await service.redeem({
    code: 'A'.repeat(43),
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state: transaction.state,
    codeVerifier: transaction.codeVerifier,
    transactionCookie: transaction.transactionCookie,
  });
  assert.match(result.token, /^zta1_[A-Za-z0-9_-]{43}$/);
  assert.notEqual(sessions.record.hash, result.token);
  assert.equal(sessions.record.parent_session_hash, 'a'.repeat(64));
});

test('redeem rejects wrong client or redirect before contacting DAppGenius', async () => {
  const sessions = store();
  let called = false;
  const service = new ZtaHandoffService(sessions, { post: async () => { called = true; } }, config);
  await assert.rejects(
    service.redeem({ code: 'A'.repeat(43), clientId: 'wrong', redirectUri: config.redirectUri, state: 's', codeVerifier: 'B'.repeat(43) }),
    ZtaHandoffError,
  );
  assert.equal(called, false);
});

test('validation rechecks the parent strict session and revokes local access when it is gone', async () => {
  const active = store();
  const running = new ZtaHandoffService(active, http(true), config);
  const runningTransaction = await running.startTransaction();
  const issued = await running.redeem({ code: 'A'.repeat(43), clientId: config.clientId, redirectUri: config.redirectUri, state: runningTransaction.state, codeVerifier: runningTransaction.codeVerifier, transactionCookie: runningTransaction.transactionCookie });
  assert.equal((await running.validate(issued.token)).userId, '11111111-1111-4111-8111-111111111111');
  const revoked = store();
  const gone = new ZtaHandoffService(revoked, http(false), config);
  const goneTransaction = await gone.startTransaction();
  const goneIssued = await gone.redeem({ code: 'A'.repeat(43), clientId: config.clientId, redirectUri: config.redirectUri, state: goneTransaction.state, codeVerifier: goneTransaction.codeVerifier, transactionCookie: goneTransaction.transactionCookie });
  await assert.rejects(gone.validate(goneIssued.token), ZtaHandoffError);
  assert.ok(revoked.record.revoked_at);
});
