const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');
const { createConnection } = require('typeorm');

const { CreateZtaAuthSessions1762000000000 } = require('../shared/infra/typeorm/zta-migrations/1762000000000-CreateZtaAuthSessions');
const { CreateZtaHandoffTransactions1762000001000 } = require('../shared/infra/typeorm/zta-migrations/1762000001000-CreateZtaHandoffTransactions');

const run = process.env.RUN_STRICT_LOCAL_PG === '1' ? test : test.skip;
let db;
let appServer;
let dappServer;
let dappPort;
let validateParent = true;
let route;
const clientId = 'zta-web';
const redirectUri = 'https://zta-coin.org/auth/callback';
const origin = 'https://zta-coin.org';
const serviceToken = 'local-only-handoff-secret';

function cookieValue(setCookie, name) {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(setCookie || '');
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function call(path, options = {}) {
  return fetch(`http://127.0.0.1:${appServer.address().port}${path}`, {
    ...options,
    headers: { Origin: origin, ...(options.headers || {}) },
  });
}

run('ZTA routes use the real transaction store and migrations', async t => {
  await t.test('setup', async () => {
    dappServer = http.createServer((request, response) => {
      let body = '';
      request.on('data', chunk => { body += chunk; });
      request.on('end', () => {
        if (request.headers['x-zta-handoff-token'] !== serviceToken) {
          response.writeHead(401); response.end(); return;
        }
        response.setHeader('Content-Type', 'application/json');
        if (request.url.endsWith('/validate-parent')) {
          response.end(JSON.stringify({ valid: validateParent }));
        } else {
          response.end(JSON.stringify({ userId: '11111111-1111-4111-8111-111111111111', parentSessionHash: 'a'.repeat(64) }));
        }
      });
    });
    await new Promise(resolve => dappServer.listen(0, '127.0.0.1', resolve));
    dappPort = dappServer.address().port;
    process.env.DAPPGENIUS_HANDOFF_REDEEM_URL = `http://127.0.0.1:${dappPort}/redeem`;
    process.env.DAPPGENIUS_HANDOFF_VALIDATE_URL = `http://127.0.0.1:${dappPort}/validate-parent`;
    process.env.ZTA_HANDOFF_SERVICE_TOKEN = serviceToken;
    process.env.ZTA_HANDOFF_CLIENT_ID = clientId;
    process.env.ZTA_HANDOFF_REDIRECT_URI = redirectUri;
    process.env.DAPPGENIUS_ORIGIN = 'https://dappgenius.dev';
    process.env.ZTA_ALLOWED_ORIGIN = origin;
    db = await createConnection({
      name: 'default', type: 'postgres', host: process.env.ZTA_PG_SOCKET || '/private/tmp/dappgenius-strict-test-socket',
      port: Number(process.env.ZTA_PG_PORT || 55439), username: 'strict_test', database: 'strict_session_test', logging: false,
    });
    const runner = db.createQueryRunner();
    await new CreateZtaAuthSessions1762000000000().up(runner);
    await new CreateZtaHandoffTransactions1762000001000().up(runner);
    const { CreateZtaPersonalAccounts1762000002000 } = require('../shared/infra/typeorm/zta-migrations/1762000002000-CreateZtaPersonalAccounts');
    await new CreateZtaPersonalAccounts1762000002000().up(runner);
    await runner.release();
    route = require('../modules/auth/auth.routes').default;
    const app = express();
    app.use(require('../shared/infra/http/corsPolicy').publicApiCors);
    app.use(express.json());
    app.use('/auth', route);
    app.use('/me/balance', require('../modules/personalBalance/personalBalance.routes').default);
    appServer = http.createServer(app);
    await new Promise(resolve => appServer.listen(0, '127.0.0.1', resolve));
  });

  await t.test('start sets browser transaction cookie and redemption sets host-only session cookie', async () => {
    const preflight = await call('/auth/handoff/start', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
    const started = await call('/auth/handoff/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }),
    });
    assert.equal(started.status, 200);
    const setCookie = started.headers.get('set-cookie');
    assert.match(setCookie, /zta_handoff_tx=ztat_/);
    assert.match(setCookie, /Secure/);
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assert.doesNotMatch(setCookie, /Domain=/i);
    const values = await started.json();
    const txCookie = setCookie.split(';')[0];
    const redeemed = await call('/auth/handoff/redeem', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: txCookie },
      body: JSON.stringify({ code: 'A'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: values.state, code_verifier: values.codeVerifier }),
    });
    assert.equal(redeemed.status, 204);
    const sessionCookie = redeemed.headers.get('set-cookie');
    assert.match(sessionCookie, /zta_session=zta1_/);
    assert.match(sessionCookie, /Secure/);
    assert.match(sessionCookie, /HttpOnly/);
    assert.match(sessionCookie, /SameSite=Lax/);
    assert.doesNotMatch(sessionCookie, /Domain=/i);
  });

  await t.test('origin, cookie, substitution, replay, and concurrency checks fail closed', async () => {
    const forgedOrigin = await call('/auth/handoff/start', {
      method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }),
    });
    assert.equal(forgedOrigin.status, 401);
    const first = await call('/auth/handoff/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }) });
    const second = await call('/auth/handoff/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }) });
    const a = await first.json(); const b = await second.json();
    const txA = first.headers.get('set-cookie').split(';')[0];
    const txB = second.headers.get('set-cookie').split(';')[0];
    const noCookie = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'B'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: a.state, code_verifier: a.codeVerifier }) });
    assert.equal(noCookie.status, 401);
    const substituted = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: txB }, body: JSON.stringify({ code: 'C'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: a.state, code_verifier: a.codeVerifier }) });
    assert.equal(substituted.status, 401);
    const requests = [1, 2].map(() => call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: txA }, body: JSON.stringify({ code: 'D'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: a.state, code_verifier: a.codeVerifier }) }));
    const concurrent = await Promise.all(requests);
    assert.deepEqual(concurrent.map(response => response.status).sort(), [204, 401]);
    const replay = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: txA }, body: JSON.stringify({ code: 'D'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: a.state, code_verifier: a.codeVerifier }) });
    assert.equal(replay.status, 401);
  });

  await t.test('parent revocation fails closed and logout invalidates the ZTA session', async () => {
    validateParent = false;
    const started = await call('/auth/handoff/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }) });
    const values = await started.json();
    const txCookie = started.headers.get('set-cookie').split(';')[0];
    const redeemed = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: txCookie }, body: JSON.stringify({ code: 'E'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: values.state, code_verifier: values.codeVerifier }) });
    const sessionCookie = redeemed.headers.get('set-cookie').split(';')[0];
    const invalid = await call('/auth/session', { headers: { Cookie: sessionCookie } });
    assert.equal(invalid.status, 401);
    validateParent = true;
    const fresh = await call('/auth/handoff/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }) });
    const freshValues = await fresh.json();
    const freshRedeemed = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: fresh.headers.get('set-cookie').split(';')[0] }, body: JSON.stringify({ code: 'F'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: freshValues.state, code_verifier: freshValues.codeVerifier }) });
    const cookie = freshRedeemed.headers.get('set-cookie').split(';')[0];
    assert.equal((await call('/auth/session', { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await call('/auth/logout', { method: 'POST', headers: { Cookie: cookie } })).status, 204);
    assert.equal((await call('/auth/session', { headers: { Cookie: cookie } })).status, 401);
  });

  await t.test('malformed, duplicate, missing and forged cookies never expose internal errors', async () => {
    const values = ['%', '%GG', '%E0%A4%A', '%00', '', 'forged', `zta1_${'Z'.repeat(43)}`];
    for (const value of values) {
      for (const path of ['/auth/session', '/auth/logout', '/me/balance']) {
        const response = await call(path, { method: path.endsWith('logout') ? 'POST' : 'GET', headers: { Cookie: `zta_session=${value}` } });
        assert.equal(response.status, 401, `${path}: ${value}`);
        assert.deepEqual(await response.json(), { error: 'Authentication required' });
        assert.equal(response.headers.get('cache-control'), 'no-store');
      }
      const redeem = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `zta_handoff_tx=${value}` },
        body: JSON.stringify({ code: 'A'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: 's', code_verifier: 'B'.repeat(43) }) });
      assert.equal(redeem.status, 401);
      assert.doesNotMatch(await redeem.text(), /URIError|stack|decodeURIComponent|500/);
    }
    for (const path of ['/auth/session', '/me/balance']) {
      assert.equal((await call(path)).status, 401);
      assert.equal((await call(path, { headers: { Cookie: `zta_session=zta1_${'Z'.repeat(43)}; zta_session=zta1_${'Z'.repeat(43)}` } })).status, 401);
    }
    const duplicateTx = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `zta_handoff_tx=ztat_${'Z'.repeat(43)}; zta_handoff_tx=ztat_${'Z'.repeat(43)}` },
      body: JSON.stringify({ code: 'A'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: 's', code_verifier: 'B'.repeat(43) }) });
    assert.equal(duplicateTx.status, 401);
  });

  await t.test('valid balance, CORS, expired session and expired transaction fail closed', async () => {
    const start = async () => call('/auth/handoff/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri }) });
    const started = await start();
    const tx = await started.json();
    const redeem = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: started.headers.get('set-cookie').split(';')[0] },
      body: JSON.stringify({ code: 'G'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: tx.state, code_verifier: tx.codeVerifier }) });
    assert.equal(redeem.status, 204);
    const cookie = redeem.headers.get('set-cookie').split(';')[0];
    const balance = await call('/me/balance', { headers: { Cookie: cookie } });
    assert.equal(balance.status, 200);
    assert.equal(balance.headers.get('access-control-allow-origin'), origin);
    assert.equal(balance.headers.get('access-control-allow-credentials'), 'true');
    assert.deepEqual(await balance.json(), { accountId: 'personal:11111111-1111-4111-8111-111111111111', balance: '0.00000000' });
    assert.equal((await call('/me/balance', { headers: { Cookie: cookie, Origin: 'https://evil.example' } })).status, 401);
    assert.equal((await call('/auth/session', { headers: { Cookie: cookie, Origin: 'https://dappgenius.dev' } })).status, 401);
    await db.query(`UPDATE zta_auth_sessions SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second'`);
    for (const path of ['/auth/session', '/me/balance']) assert.equal((await call(path, { headers: { Cookie: cookie } })).status, 401);
    const expiredStart = await start();
    const expiredTx = await expiredStart.json();
    await db.query(`UPDATE zta_handoff_transactions SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second'`);
    const expired = await call('/auth/handoff/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: expiredStart.headers.get('set-cookie').split(';')[0] },
      body: JSON.stringify({ code: 'H'.repeat(43), client_id: clientId, redirect_uri: redirectUri, state: expiredTx.state, code_verifier: expiredTx.codeVerifier }) });
    assert.equal(expired.status, 401);
  });

  await t.test('cleanup', async () => {
    const runner = db.createQueryRunner();
    const { CreateZtaPersonalAccounts1762000002000 } = require('../shared/infra/typeorm/zta-migrations/1762000002000-CreateZtaPersonalAccounts');
    await new CreateZtaPersonalAccounts1762000002000().down(runner);
    await new CreateZtaHandoffTransactions1762000001000().down(runner);
    await new CreateZtaAuthSessions1762000000000().down(runner);
    await runner.release();
    await db.close();
    await new Promise(resolve => appServer.close(resolve));
    await new Promise(resolve => dappServer.close(resolve));
  });
});
