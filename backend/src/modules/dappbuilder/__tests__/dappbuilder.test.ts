import express from 'express';
import request from 'supertest';
import axios from 'axios';

// Mock axios before any module under test is imported so the controller
// receives mocked functions from its first require().
jest.mock('axios', () => {
  const mock = {
    post: jest.fn(),
    isAxiosError: jest.fn(() => false),
  };
  return { ...mock, default: mock };
});

// Import router AFTER the mock is in place.
// eslint-disable-next-line import/first
import dappBuilderRouter from '../infra/http/routes/dappbuilder.routes';

// Minimal Express app — no database, no socket, no other middleware.
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/dapp-builder', dappBuilderRouter);
  return app;
}

const VALID_BODY = {
  dappName: 'Test App',
  template: 'token-dashboard',
  workflow: [],
};

const MOCK_HTML =
  '<!DOCTYPE html><html><body><h1>Test</h1>' +
  '<button>Go</button><form><input type="text" /></form></body></html>';

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ANTHROPIC_API_KEY;
});

afterAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

// ── Route registration ────────────────────────────────────────────────────────

test('POST /dapp-builder/generate is registered — returns non-404', async () => {
  const res = await request(makeApp()).post('/dapp-builder/generate').send(VALID_BODY);
  // Missing API key → 500, not 404. Proves the route is mounted at this exact path.
  expect(res.status).not.toBe(404);
});

test('an unknown path returns 404', async () => {
  const res = await request(makeApp()).post('/dapp-builder/unknown-path').send({});
  expect(res.status).toBe(404);
});

// ── Missing ANTHROPIC_API_KEY → safe config error, not 404 ───────────────────

test('missing ANTHROPIC_API_KEY returns 500 with a configuration error message', async () => {
  // ANTHROPIC_API_KEY is not set (cleared in beforeEach)
  const res = await request(makeApp())
    .post('/dapp-builder/generate')
    .send(VALID_BODY);

  expect(res.status).toBe(500);
  expect(res.body).toMatchObject({
    error: expect.stringContaining('ANTHROPIC_API_KEY'),
  });
});

// ── Successful generation response shape ─────────────────────────────────────

test('successful generation returns { html: string }', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';

  (axios.post as jest.Mock).mockResolvedValueOnce({
    data: {
      content: [{ type: 'text', text: MOCK_HTML }],
    },
  });

  const res = await request(makeApp())
    .post('/dapp-builder/generate')
    .send(VALID_BODY);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ html: MOCK_HTML });
});
