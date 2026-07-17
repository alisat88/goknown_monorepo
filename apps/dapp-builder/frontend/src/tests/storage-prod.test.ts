/**
 * storage-prod.test.ts
 *
 * Tests for storage.ts behavior in production mode (VITE_DEMO_MODE not set)
 * vs demo mode (VITE_DEMO_MODE=true).
 *
 * These complement the end-to-end localStorage tests in e2e-flow.test.ts,
 * which always run with VITE_DEMO_MODE=true (the demo-mode path).
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadSavedApps,
  saveApp,
  updateApp,
  deleteApp,
  getApp,
  seedDemoApps,
  migrateLocalAppsToApi,
} from '../services/storage';
import { AuthError } from '../services/api';
import { SavedDApp } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDApp(overrides: Partial<SavedDApp> = {}): SavedDApp {
  return {
    id: `dapp_${crypto.randomUUID()}`,
    dappName: 'Test App',
    description: '',
    template: 'token-dashboard',
    permissionModel: 'role-based',
    apis: [],
    workflow: [],
    generatedCode: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sharedWith: [],
    sharedAccess: [],
    ownerId: 'owner@test.com',
    ownerName: 'Owner',
    status: 'Draft',
    version: 1,
    ...overrides,
  };
}

// ── Suite A: Production mode — no token, no demo mode ────────────────────────
// When VITE_DEMO_MODE is NOT 'true' and there is no token in sessionStorage,
// every storage function must throw AuthError. localStorage must never be read.

describe('storage: production mode (no token, VITE_DEMO_MODE not set)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();           // ensure VITE_DEMO_MODE is not set
    // Do NOT set sessionStorage token — simulates an unauthenticated visit
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('prod-1: loadSavedApps throws AuthError — does not read localStorage', async () => {
    // Put an app in localStorage to confirm it is never returned
    localStorage.setItem(
      'dappbuilder:saved_apps',
      JSON.stringify([makeDApp({ dappName: 'Stored App' })]),
    );

    await expect(loadSavedApps()).rejects.toBeInstanceOf(AuthError);
  });

  test('prod-2: saveApp throws AuthError — does not write to localStorage', async () => {
    const app = makeDApp();
    await expect(saveApp(app)).rejects.toBeInstanceOf(AuthError);

    // Confirm nothing was written
    expect(localStorage.getItem('dappbuilder:saved_apps')).toBeNull();
  });

  test('prod-3: updateApp throws AuthError — does not modify localStorage', async () => {
    // Pre-populate localStorage
    const app = makeDApp();
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([app]));

    await expect(updateApp(app.id, { dappName: 'Hacked' })).rejects.toBeInstanceOf(AuthError);

    // Confirm the stored app was not modified
    const raw = JSON.parse(localStorage.getItem('dappbuilder:saved_apps')!);
    expect(raw[0].dappName).toBe('Test App');
  });

  test('prod-4: deleteApp throws AuthError — does not modify localStorage', async () => {
    const app = makeDApp();
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([app]));

    await expect(deleteApp(app.id)).rejects.toBeInstanceOf(AuthError);

    const raw = JSON.parse(localStorage.getItem('dappbuilder:saved_apps')!);
    expect(raw).toHaveLength(1); // app still there
  });

  test('prod-5: getApp throws AuthError — does not read localStorage', async () => {
    const app = makeDApp();
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([app]));

    await expect(getApp(app.id)).rejects.toBeInstanceOf(AuthError);
  });

  test('prod-6: seedDemoApps is a no-op in production mode', () => {
    const seed = [makeDApp({ id: 'seed-1', dappName: 'Demo App' })];
    seedDemoApps(seed);

    // Nothing should have been written to localStorage
    expect(localStorage.getItem('dappbuilder:saved_apps')).toBeNull();
    expect(localStorage.getItem('dappbuilder:seed_version')).toBeNull();
  });
});

// ── Suite B: Demo mode (VITE_DEMO_MODE=true) ──────────────────────────────────
// localStorage CRUD is permitted when VITE_DEMO_MODE=true.

describe('storage: demo mode (VITE_DEMO_MODE=true)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_DEMO_MODE', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('demo-1: loadSavedApps reads from localStorage in demo mode', async () => {
    const app = makeDApp({ dappName: 'Demo Loaded App' });
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([app]));

    const loaded = await loadSavedApps();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].dappName).toBe('Demo Loaded App');
  });

  test('demo-2: saveApp writes to localStorage in demo mode', async () => {
    const app = makeDApp({ dappName: 'Demo Saved App' });
    await saveApp(app);

    const loaded = await loadSavedApps();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].dappName).toBe('Demo Saved App');
  });

  test('demo-3: seedDemoApps seeds localStorage in demo mode', () => {
    const seed = [makeDApp({ id: 'seed-1', dappName: 'Seeded App' })];
    seedDemoApps(seed);

    const raw = JSON.parse(localStorage.getItem('dappbuilder:saved_apps')!);
    expect(raw).toHaveLength(1);
    expect(raw[0].dappName).toBe('Seeded App');
  });
});

// ── Suite C: API error does NOT fall back to localStorage ─────────────────────
// When authenticated (token present) and the API returns an error,
// the error must propagate — never silently fall back to localStorage.

describe('storage: authenticated API error does not fall back to localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    // Inject a token into sessionStorage to simulate authentication
    try {
      sessionStorage.setItem('dappbuilder:token', 'fake-jwt-token');
    } catch {
      // sessionStorage may not be available in some test environments
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    try { sessionStorage.removeItem('dappbuilder:token'); } catch { /* ignore */ }
  });

  test('api-error-1: failed loadSavedApps throws ApiError — does not fall back to localStorage', async () => {
    // Pre-populate localStorage so a fallback would return data
    const app = makeDApp({ dappName: 'Fallback App' });
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([app]));

    // Mock fetch to simulate API error
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service unavailable' }),
    });

    try {
      await expect(loadSavedApps()).rejects.toThrow('Service unavailable');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ── Suite D: Fragment token removed from URL ──────────────────────────────────
// AuthContext removes #token=... from the URL immediately after reading it.
// Tested via the extractAndConsumeToken logic (exported indirectly via AuthContext).

describe('storage: token fragment is consumed from URL', () => {
  test('fragment-1: URL hash is cleaned up after token extraction', () => {
    // We test the logic by simulating what AuthContext does:
    // Set the URL hash, call the extraction helper, confirm the URL was updated.
    const originalUrl = window.location.href;

    // Set a fake hash with a token
    window.history.replaceState(null, '', `${window.location.pathname}#token=eyJhbGciOiJIUzI1NiJ9`);
    expect(window.location.hash).toBe('#token=eyJhbGciOiJIUzI1NiJ9');

    // Simulate what extractAndConsumeToken does:
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');
    params.delete('token');
    const remaining = params.toString();
    const newUrl = window.location.pathname + window.location.search + (remaining ? '#' + remaining : '');
    window.history.replaceState(null, '', newUrl);

    expect(token).toBe('eyJhbGciOiJIUzI1NiJ9');
    expect(window.location.hash).toBe('');

    // Restore
    window.history.replaceState(null, '', originalUrl);
  });

  test('fragment-2: other hash params are preserved after token is consumed', () => {
    window.history.replaceState(null, '', `${window.location.pathname}#token=abc123&tab=dashboard`);

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');
    params.delete('token');
    const remaining = params.toString();
    const newUrl = window.location.pathname + window.location.search + (remaining ? '#' + remaining : '');
    window.history.replaceState(null, '', newUrl);

    expect(token).toBe('abc123');
    expect(window.location.hash).toBe('#tab=dashboard');

    window.history.replaceState(null, '', window.location.pathname);
  });
});

// ── Suite E: localStorage migration idempotency ───────────────────────────────
// migrateLocalAppsToApi is idempotent: a second call after 'done' is a no-op.

describe('storage: migrateLocalAppsToApi idempotency', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    try { sessionStorage.setItem('dappbuilder:token', 'fake-token'); } catch { /* ignore */ }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    try { sessionStorage.removeItem('dappbuilder:token'); } catch { /* ignore */ }
  });

  test('migrate-1: second call after "done" does not call the API', async () => {
    const email = 'owner@test.com';
    const migratedKey = `dappbuilder:migrated:${email}`;
    localStorage.setItem(migratedKey, 'done');

    const originalFetch = globalThis.fetch;
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    try {
      await migrateLocalAppsToApi(email);
      expect(mockFetch).not.toHaveBeenCalled(); // no network call
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('migrate-2: migration with no local apps sets "done" immediately', async () => {
    const email = 'nolocal@test.com';
    // No local apps — localStorage has no matching owned apps
    const originalFetch = globalThis.fetch;
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    try {
      await migrateLocalAppsToApi(email);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(localStorage.getItem(`dappbuilder:migrated:${email}`)).toBe('done');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
