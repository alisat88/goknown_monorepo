import { describe, test, expect, afterEach, vi, beforeEach } from 'vitest';
import { getApiBase, generateDAppCode, generateEditedDAppCode } from '../lib/generateCode';

// ── getApiBase() — URL construction ──────────────────────────────────────────

describe('getApiBase', () => {
  afterEach(() => vi.unstubAllEnvs());

  test('falls back to localhost when VITE_API_URL is not set', () => {
    expect(getApiBase()).toBe('http://localhost:3333');
  });

  test('uses VITE_API_URL when set', () => {
    vi.stubEnv('VITE_API_URL', 'https://goknown-monorepo.onrender.com');
    expect(getApiBase()).toBe('https://goknown-monorepo.onrender.com');
  });

  test('strips a trailing slash from VITE_API_URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://goknown-monorepo.onrender.com/');
    expect(getApiBase()).toBe('https://goknown-monorepo.onrender.com');
  });

  test('constructs the correct production generate URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://goknown-monorepo.onrender.com');
    expect(`${getApiBase()}/dapp-builder/generate`).toBe(
      'https://goknown-monorepo.onrender.com/dapp-builder/generate',
    );
  });
});

// ── generateDAppCode — fetch destination ─────────────────────────────────────

describe('generateDAppCode', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'https://goknown-monorepo.onrender.com');
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ html: '<html>ok</html>' }), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('POSTs to /dapp-builder/generate with correct production URL', async () => {
    await generateDAppCode({
      dappName: 'Test',
      template: 'token-dashboard',
      apis: [],
      workflow: [],
      userPrompt: 'build it',
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://goknown-monorepo.onrender.com/dapp-builder/generate');
    expect(init.method).toBe('POST');
  });

  test('POSTs to /dapp-builder/edit with correct production URL', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ html: '<html>edited</html>' }), { status: 200 }),
    );

    await generateEditedDAppCode('<html>old</html>', 'make it blue', 'My App');

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://goknown-monorepo.onrender.com/dapp-builder/edit');
    expect(init.method).toBe('POST');
  });
});
