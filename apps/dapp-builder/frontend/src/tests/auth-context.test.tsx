// Tests specifically covering the AuthContext regression:
//   JWT present → /profile never called → currentUser null → wizard never opens.
//
// Root cause: AuthContext only populated currentUser from URL query params or a
// prior sessionStorage entry. On a fresh production visit neither existed, so
// currentUser was always null and the wizard render condition silently failed.
//
// These tests verify the fix AND the security constraints:
//   - When a JWT is present, /profile is ALWAYS called (cache never skips it).
//   - URL query params only work when VITE_DEMO_MODE=true and no JWT is present.
//   - 401/403 clears the token and cached identity.
//   - Network/5xx failures set a visible authError.

import React from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { BuilderDashboard } from '../components/BuilderDashboard';

// ── Module mocks ──────────────────────────────────────────────────────────────

// generateCode is imported by BuilderDashboard → CodeGenerationPreview and wizard
vi.mock('../lib/generateCode', () => ({
  generateDAppCode: vi.fn(),
  generateEditedDAppCode: vi.fn(),
  validateGeneratedHtml: vi.fn(() => null),
  buildEditUserPrompt: vi.fn(),
}));

// Storage is imported by BuilderDashboard
const mockLoadSavedApps    = vi.fn(() => Promise.resolve([]));
const mockMigrateLocal     = vi.fn(() => Promise.resolve());
const mockSeedDemoApps     = vi.fn();
vi.mock('../services/storage', () => ({
  loadSavedApps:         (...args: unknown[]) => mockLoadSavedApps(...args),
  migrateLocalAppsToApi: (...args: unknown[]) => mockMigrateLocal(...args),
  seedDemoApps:          (...args: unknown[]) => mockSeedDemoApps(...args),
  saveApp:               vi.fn((app: unknown) => Promise.resolve(app)),
  updateApp:             vi.fn((_id: unknown, u: unknown) => Promise.resolve(u)),
  deleteApp:             vi.fn(() => Promise.resolve()),
  getApp:                vi.fn(() => Promise.resolve(null)),
}));

// Navigation utility used by BuilderDashboard
vi.mock('../lib/navigation', () => ({
  getDashboardUrl: vi.fn(() => 'https://dappgenius.dev'),
}));

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_RESPONSE = {
  id: 'user-uuid-abc123',
  name: 'Alisa T',
  email: 'atiselska@goknown.com',
  sync_id: 'sync-abc123',
  role: 'user',
};

function makeProfileFetch(override: Partial<typeof PROFILE_RESPONSE> = {}) {
  const body = { ...PROFILE_RESPONSE, ...override };
  return vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/profile')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
      });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${String(url)}`));
  });
}

function makeErrorFetch(status: number, body: Record<string, string> = {}) {
  return vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/profile')) {
      return Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve(body),
      });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${String(url)}`));
  });
}

// Minimal consumer for inspecting context values
function AuthConsumer() {
  const { currentUser, isLoading, authError } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user-id">{currentUser?.userId ?? ''}</span>
      <span data-testid="user-name">{currentUser?.userName ?? ''}</span>
      <span data-testid="user-email">{currentUser?.userEmail ?? ''}</span>
      <span data-testid="auth-error">{authError ?? ''}</span>
    </div>
  );
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockLoadSavedApps.mockResolvedValue([]);
  mockMigrateLocal.mockResolvedValue(undefined);
  // Clear sessionStorage between tests
  try { sessionStorage.clear(); } catch { /* ignore */ }
  // Restore URL to a clean state
  window.history.replaceState(null, '', window.location.pathname);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  try { sessionStorage.clear(); } catch { /* ignore */ }
});

// ── auth-1: JWT in sessionStorage, no dappbuilder:auth_user → /profile is called ──────

test('auth-1: JWT in sessionStorage without cached identity triggers a GET /profile call', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }

  const fetchSpy = makeProfileFetch();
  globalThis.fetch = fetchSpy;

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  const profileCalls = fetchSpy.mock.calls.filter(
    ([url]: [string]) => typeof url === 'string' && url.includes('/profile'),
  );
  expect(profileCalls.length).toBe(1);
});

// ── auth-2: Successful /profile → currentUser has correct fields ──────────────────────

test('auth-2: successful /profile response populates currentUser with id, name, and email', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }
  globalThis.fetch = makeProfileFetch();

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('user-email').textContent).toBe(PROFILE_RESPONSE.email);
  });

  expect(screen.getByTestId('user-id').textContent).toBe(PROFILE_RESPONSE.id);
  expect(screen.getByTestId('user-name').textContent).toBe(PROFILE_RESPONSE.name);
  expect(screen.getByTestId('loading').textContent).toBe('false');
});

// ── auth-3: Successful /profile → identity saved to sessionStorage ─────────────────────

test('auth-3: successful /profile response saves the user identity to sessionStorage', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }
  globalThis.fetch = makeProfileFetch();

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('user-email').textContent).toBe(PROFILE_RESPONSE.email);
  });

  let stored: Record<string, string> | null = null;
  try {
    const raw = sessionStorage.getItem('dappbuilder:auth_user');
    stored = raw ? JSON.parse(raw) as Record<string, string> : null;
  } catch { /* ignore */ }

  expect(stored).not.toBeNull();
  expect(stored?.userEmail).toBe(PROFILE_RESPONSE.email);
  expect(stored?.userId).toBe(PROFILE_RESPONSE.id);
});

// ── auth-4: JWT present → /profile ALWAYS called; cached identity is overwritten ──────

test('auth-4: when JWT is present, /profile is always called and overwrites any cached identity', async () => {
  // Plant a stale cached identity for a different user
  try {
    sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token');
    sessionStorage.setItem('dappbuilder:auth_user', JSON.stringify({
      userId: 'stale-user-id',
      userName: 'Stale User',
      userEmail: 'stale@example.com',
    }));
  } catch { return; }

  // Backend returns the real (current) identity
  const fetchSpy = makeProfileFetch();
  globalThis.fetch = fetchSpy;

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  // /profile must have been called even though sessionStorage had a cached entry
  const profileCalls = fetchSpy.mock.calls.filter(
    ([url]: [string]) => typeof url === 'string' && url.includes('/profile'),
  );
  expect(profileCalls.length).toBeGreaterThanOrEqual(1);

  // Backend identity wins; the stale cached identity is replaced
  expect(screen.getByTestId('user-email').textContent).toBe(PROFILE_RESPONSE.email);
  expect(screen.getByTestId('user-id').textContent).toBe(PROFILE_RESPONSE.id);
  expect(screen.getByTestId('user-id').textContent).not.toBe('stale-user-id');
});

// ── auth-5: BuilderDashboard: after profile resolves, wizard opens on template click ──────

test('auth-5: clicking "Use this template" after profile resolution renders the CreateDAppWizard', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }
  globalThis.fetch = makeProfileFetch();

  render(
    <AuthProvider>
      <BuilderDashboard />
    </AuthProvider>,
  );

  // Navigate to Templates tab
  const templatesTab = await screen.findByRole('tab', { name: /templates/i });
  fireEvent.click(templatesTab);

  // Click the first "Use this template" button once templates are visible
  const [useTemplateBtn] = await screen.findAllByText('Use this template →');
  fireEvent.click(useTemplateBtn);

  // Wizard must appear
  const dialog = await screen.findByRole('dialog', { name: /create app wizard/i });
  expect(dialog).toBeDefined();
}, 5000);

// ── auth-6: Forged ?userId params are IGNORED when a JWT is present ───────────────────

test('auth-6: forged URL query params cannot override the JWT-backed identity', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }

  // Attacker adds identity params to the URL
  window.history.replaceState(
    null,
    '',
    '?userId=attacker-id&userName=Hacker&userEmail=hacker@evil.com',
  );

  globalThis.fetch = makeProfileFetch();

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  // Identity must come from /profile, not URL params
  expect(screen.getByTestId('user-email').textContent).toBe(PROFILE_RESPONSE.email);
  expect(screen.getByTestId('user-id').textContent).toBe(PROFILE_RESPONSE.id);
  expect(screen.getByTestId('user-name').textContent).toBe(PROFILE_RESPONSE.name);
});

// ── auth-7: /profile 401 → clears token and session, currentUser null, no authError ────

test('auth-7: /profile 401 clears the token and cached identity, leaves currentUser null', async () => {
  try {
    sessionStorage.setItem('dappbuilder:token', 'expired-jwt');
    sessionStorage.setItem('dappbuilder:auth_user', JSON.stringify({
      userId: 'some-user-id',
      userName: 'Some User',
      userEmail: 'some@example.com',
    }));
  } catch { return; }

  globalThis.fetch = makeErrorFetch(401, { error: 'Unauthorized' });

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-email').textContent).toBe('');
  expect(screen.getByTestId('auth-error').textContent).toBe('');

  // Token and session cache must be cleared
  expect(sessionStorage.getItem('dappbuilder:token')).toBeNull();
  expect(sessionStorage.getItem('dappbuilder:auth_user')).toBeNull();
});

// ── auth-8: /profile 500 → authError set, currentUser null, no demo identity ─────────

test('auth-8: /profile 500 sets a visible authError and does not fall back to demo identity', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }

  globalThis.fetch = makeErrorFetch(500, { error: 'Internal server error' });

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-email').textContent).toBe('');
  // authError must be set — visible in the UI as an error banner
  expect(screen.getByTestId('auth-error').textContent).not.toBe('');
  expect(screen.getByTestId('auth-error').textContent).toMatch(/server error/i);
});

// ── auth-9: /profile with missing required fields → authError, currentUser null ──────

test('auth-9: /profile response missing required identity fields sets authError and leaves currentUser null', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }

  // Backend returns a 200 with an incomplete object (e.g. email is missing)
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'some-id', name: 'Someone' /* no email */ }),
    }),
  );

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-email').textContent).toBe('');
  expect(screen.getByTestId('auth-error').textContent).not.toBe('');
});

// ── auth-10: useEffect has empty dep array — /profile called exactly once ─────────────

test('auth-10: AuthContext useEffect has empty deps — /profile called exactly once, no infinite loop', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }

  const fetchSpy = makeProfileFetch();
  globalThis.fetch = fetchSpy;

  const { rerender } = render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  // Trigger several re-renders to confirm the effect does not re-run
  rerender(<AuthProvider><AuthConsumer /></AuthProvider>);
  rerender(<AuthProvider><AuthConsumer /></AuthProvider>);

  const profileCalls = fetchSpy.mock.calls.filter(
    ([url]: [string]) => typeof url === 'string' && url.includes('/profile'),
  );
  expect(profileCalls.length).toBe(1);
});

// ── auth-11: no JWT + production + forged URL params → currentUser null ──────────────

test('auth-11: no JWT in production — forged URL query params do not create an identity', async () => {
  // No token (cleared by beforeEach), VITE_DEMO_MODE not set (production default)
  vi.unstubAllEnvs();

  window.history.replaceState(
    null,
    '',
    '?userId=forged-id&userName=Forger&userEmail=forger@evil.com',
  );

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-id').textContent).toBe('');
  expect(screen.getByTestId('user-email').textContent).toBe('');
  expect(screen.getByTestId('user-name').textContent).toBe('');
});

// ── auth-12: no JWT + VITE_DEMO_MODE=true + valid URL params → demo identity set ──────

test('auth-12: no JWT with VITE_DEMO_MODE=true — URL query params provide a demo identity', async () => {
  // No token (cleared by beforeEach)
  vi.stubEnv('VITE_DEMO_MODE', 'true');

  window.history.replaceState(
    null,
    '',
    '?userId=demo-user-123&userName=Demo+User&userEmail=demo%40example.com',
  );

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-id').textContent).toBe('demo-user-123');
  expect(screen.getByTestId('user-name').textContent).toBe('Demo User');
  expect(screen.getByTestId('user-email').textContent).toBe('demo@example.com');
});

// ── auth-13: /profile 403 → clears token and session, currentUser null, no authError ──

test('auth-13: /profile 403 clears the token and cached identity, leaves currentUser null', async () => {
  try {
    sessionStorage.setItem('dappbuilder:token', 'forbidden-jwt');
    sessionStorage.setItem('dappbuilder:auth_user', JSON.stringify({
      userId: 'some-user-id',
      userName: 'Some User',
      userEmail: 'some@example.com',
    }));
  } catch { return; }

  globalThis.fetch = makeErrorFetch(403, { error: 'Forbidden' });

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-email').textContent).toBe('');
  expect(screen.getByTestId('auth-error').textContent).toBe('');

  // Token and session cache must be cleared
  expect(sessionStorage.getItem('dappbuilder:token')).toBeNull();
  expect(sessionStorage.getItem('dappbuilder:auth_user')).toBeNull();
});

// ── auth-14: network failure when fetching /profile → authError set ───────────────────

test('auth-14: a network-level failure when fetching /profile sets a visible authError', async () => {
  try { sessionStorage.setItem('dappbuilder:token', 'valid-jwt-token'); } catch { return; }

  // Simulate a network failure (fetch rejects, not a non-OK HTTP response)
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/profile')) {
      return Promise.reject(new TypeError('Failed to fetch'));
    }
    return Promise.reject(new Error(`Unmocked fetch: ${String(url)}`));
  });

  render(<AuthProvider><AuthConsumer /></AuthProvider>);

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user-email').textContent).toBe('');
  expect(screen.getByTestId('auth-error').textContent).not.toBe('');
  expect(screen.getByTestId('auth-error').textContent).toMatch(/network error/i);
});

// ── auth-15: production auth gate says "Sign in to DAppGenius", not "Select your name" ──

test('auth-15: production auth gate shows sign-in link and never shows "Select your name"', async () => {
  // No token, no VITE_DEMO_MODE (production state)
  vi.unstubAllEnvs();

  render(
    <AuthProvider>
      <BuilderDashboard />
    </AuthProvider>,
  );

  // Wait for the production sign-in gate to appear
  await screen.findByText(/sign in to dappgenius to access dapp builder/i, {}, { timeout: 5000 });

  // Must NOT show the demo-mode selector
  expect(screen.queryByText('Select your name from the list')).toBeNull();
}, 5000);

// ── auth-16: demo mode auth gate shows "Select your name" when no URL identity is set ──

test('auth-16: demo mode auth gate shows "Select your name from the list" when no identity is in the URL', async () => {
  // No token, no URL params — only VITE_DEMO_MODE is set
  vi.stubEnv('VITE_DEMO_MODE', 'true');

  render(
    <AuthProvider>
      <BuilderDashboard />
    </AuthProvider>,
  );

  // Wait for the demo-mode selector heading to appear
  await screen.findByText('Select your name from the list', {}, { timeout: 5000 });

  // Must NOT show the production sign-in link
  expect(screen.queryByText(/sign in to dappgenius/i)).toBeNull();
}, 5000);
