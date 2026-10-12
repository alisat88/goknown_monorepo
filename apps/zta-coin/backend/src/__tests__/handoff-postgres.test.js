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
const origin = 'https://dappgenius.dev';
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
    process.env.DAPPGENIUS_ORIGIN = origin;
    db = await createConnection({
      name: 'default', type: 'postgres', host: '/private/tmp/dappgenius-strict-test-socket',
      port: 55439, username: 'strict_test', database: 'strict_session_test', logging: false,
    });
    const runner = db.createQueryRunner();
    await new CreateZtaAuthSessions1762000000000().up(runner);
    await new CreateZtaHandoffTransactions1762000001000().up(runner);
    await runner.release();
    route = require('../modules/auth/auth.routes').default;
    const app = express();
    app.use(express.json());
    app.use('/auth', route);
    appServer = http.createServer(app);
    await new Promise(resolve => appServer.listen(0, '127.0.0.1', resolve));
  });

  await t.test('start sets browser transaction cookie and redemption sets host-only session cookie', async () => {
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

  await t.test('cleanup', async () => {
    const runner = db.createQueryRunner();
    await new CreateZtaHandoffTransactions1762000001000().down(runner);
    await new CreateZtaAuthSessions1762000000000().down(runner);
    await runner.release();
    await db.close();
    await new Promise(resolve => appServer.close(resolve));
    await new Promise(resolve => dappServer.close(resolve));
  });
});
