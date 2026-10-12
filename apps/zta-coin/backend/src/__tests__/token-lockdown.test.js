/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS enables dependency interception before router import. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('node:http');
const Module = require('node:module');
const express = require('express');
const jwt = require('jsonwebtoken');

// Import the real mounted router and the four real public token routers.
// Replace persistence/services and copied legacy routers BEFORE importing them:
// this suite never loads dotenv, connects to a database, or starts background jobs.
const state = {
  accounts: {
    Mike: '100.00000000',
    Connie: '25.00000000',
    KNOWN_SYSTEM: '0.00000000',
  },
  ledger: [{ id: 'historical-record', amount: '25.00000000' }],
};
const originalState = JSON.stringify(state);
let sensitiveCalls = 0;
let unrelatedCalls = 0;
function forbiddenService() {
  sensitiveCalls += 1;
  throw new Error('Sensitive handler must not run during lockdown');
}
class TokenService {
  execute() {
    forbiddenService();
  }
}

const originalLoad = Module._load;
let routes;
try {
  Module._load = function load(request, parent, isMain) {
    if (/services\/(MintTokenService|TransferTokenService)$/.test(request)) {
      return TokenService;
    }
    if (request === '@shared/ledger/LedgerService') {
      return {
        ledgerService: {
          getAll: forbiddenService,
          getVelocity: forbiddenService,
        },
      };
    }
    if (request === '@shared/infra/typeorm') {
      return { isDatabaseReady: async () => true };
    }
    if (
      /\.routes$/.test(request) &&
      !/\/(mint|transfer|ledger|velocity)\.routes$/.test(request)
    ) {
      const router = express.Router();
      router.use((req, res) => {
        if (request.includes('/dashboard.routes')) {
          unrelatedCalls += 1;
          return res.sendStatus(204);
        }
        forbiddenService();
      });
      return router;
    }
    if (
      request === 'typeorm' ||
      request === 'pg' ||
      request === 'dotenv/config'
    ) {
      throw new Error(`Unexpected infrastructure import: ${request}`);
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  routes = require('../shared/infra/http/routes').default;
} finally {
  Module._load = originalLoad;
}

const endpoints = [
  ['POST', '/mint'],
  ['POST', '/transfer'],
  ['GET', '/ledger'],
  ['GET', '/velocity/Connie'],
  ['GET', '/me/transactions'],
  ['POST', '/me/transactions'],
  ['GET', '/me/transactions/organizations/other-org'],
  ['POST', '/me/transactions/organizations/other-org'],
  ['GET', '/me/charges'],
  ['POST', '/me/charges'],
  ['GET', '/me/charges/organizations/other-org'],
  ['POST', '/me/charges/organizations/other-org'],
  ['POST', '/votes'],
  ['DELETE', '/votes'],
  ['POST', '/admin/users/Connie/issue-tokens'],
  ['POST', '/admin/users/upload'],
  ['PUT', '/admin/users/Connie'],
  ['GET', '/auditlogs?filtered_user_syncid=Connie'],
  ['POST', '/sessions'],
  ['POST', '/users'],
  ['POST', '/users/invite'],
  ['POST', '/organizations'],
  ['PUT', '/organizations/other-org'],
];
const forgedBody = {
  user_id: 'KN_ISSUER',
  from_user: 'Connie',
  to_user: 'Mike',
  amount: '0.00000001',
  role: 'admin',
  masterNode: true,
};

function request(server, method, path, headers = {}) {
  const payload = JSON.stringify(forgedBody);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        agent: false,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () =>
          resolve({ status: res.statusCode, headers: res.headers, body }),
        );
      },
    );
    req.on('error', reject);
    req.end(payload);
  });
}

test('mounted ZTA API fails closed before any sensitive handler', async t => {
  const app = express();
  app.use(express.json());
  app.use(routes);
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const credentials = [
      {},
      {
        authorization: 'Bearer forged-token',
        'x-user-id': 'Connie',
        'x-role': 'issuer',
      },
      {
        authorization: `Bearer ${jwt.sign(
          { role: 'admin', twoFactorAuthentication: true },
          'default',
          { subject: 'Connie', expiresIn: '1h' },
        )}`,
      },
    ];
    for (let index = 0; index < credentials.length; index += 1) {
      await t.test(
        `all sensitive endpoints reject credential variant ${index}`,
        async () => {
          for (const [method, path] of endpoints) {
            const result = await request(
              server,
              method,
              path,
              credentials[index],
            );
            assert.equal(result.status, 403, `${method} ${path}`);
            assert.equal(result.headers['cache-control'], 'no-store');
            assert.deepEqual(JSON.parse(result.body), {
              code: 'ZTA_OPERATIONS_DISABLED',
              error:
                'ZTA token operations and activity are temporarily unavailable pending secure authorization.',
            });
          }
        },
      );
    }
    await t.test(
      'method, case, trailing slash, query and account selection cannot bypass denial',
      async () => {
        for (const method of [
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'HEAD',
          'OPTIONS',
        ]) {
          for (const path of [
            '/MINT/',
            '/transfer/Connie',
            '/ledger/?user_id=Connie',
            '/velocity/KNOWN_SYSTEM',
            '/velocity/%43onnie',
            '/me/transactions/Connie',
            '/admin/users/Connie/issue-tokens',
          ]) {
            const result = await request(server, method, path, {
              'x-http-method-override': 'POST',
            });
            assert.equal(result.status, 403, `${method} ${path}`);
            assert.equal(result.headers['cache-control'], 'no-store');
          }
        }
      },
    );
    await t.test('health and unrelated routes remain reachable', async () => {
      for (const path of ['/health', '/health/live', '/health/ready']) {
        assert.equal((await request(server, 'GET', path)).status, 200);
      }
      assert.equal((await request(server, 'GET', '/me/dashboard')).status, 204);
      assert.equal(unrelatedCalls, 1);
      assert.equal(
        (await request(server, 'GET', '/me/zta-balance')).status,
        404,
      );
      assert.equal((await request(server, 'POST', '/laboratory')).status, 404);
    });
    await t.test(
      'no sensitive reads/writes and existing account/ledger fixtures are preserved',
      () => {
        assert.equal(sensitiveCalls, 0);
        assert.equal(JSON.stringify(state), originalState);
      },
    );
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
