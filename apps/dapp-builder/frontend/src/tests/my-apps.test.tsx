// Tests for: My Apps tab navigation and false generation-error bug fixes.
//
// Root causes being tested:
//   1. "My Apps" tab: clicking did nothing because onClick used setActiveTab
//      directly without calling reloadApps, and the tab id is 'dashboard' (not
//      'my-apps'). Fixed via handleTabClick which calls reloadApps when tabId
//      === 'dashboard' and authUser is present.
//   2. False "We couldn't generate the app preview.": generation and persistence
//      shared a single try/catch, so a persistence failure surfaced as genError
//      hiding the preview. Fixed by separating genError / saveError with distinct
//      DOM blocks.

import React from 'react';
import { test, expect, vi, beforeEach, afterEach, describe } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BuilderDashboard } from '../components/BuilderDashboard';
import { CreateDAppWizard } from '../components/CreateDAppWizard';
import { AuthProvider } from '../context/AuthContext';
import { TEMPLATES } from '../data';

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockLoadSavedApps = vi.fn(() => Promise.resolve([]));
const mockSaveApp       = vi.fn();
const mockUpdateApp     = vi.fn();
const mockDeleteApp     = vi.fn(() => Promise.resolve());
const mockMigrateLocal  = vi.fn(() => Promise.resolve());
const mockSeedDemoApps  = vi.fn();

vi.mock('../services/storage', () => ({
  loadSavedApps:         (...args: unknown[]) => mockLoadSavedApps(...args),
  migrateLocalAppsToApi: (...args: unknown[]) => mockMigrateLocal(...args),
  seedDemoApps:          (...args: unknown[]) => mockSeedDemoApps(...args),
  saveApp:               (...args: unknown[]) => mockSaveApp(...args),
  updateApp:             (...args: unknown[]) => mockUpdateApp(...args),
  deleteApp:             (...args: unknown[]) => mockDeleteApp(...args),
  getApp:                vi.fn(() => Promise.resolve(null)),
}));

const mockGenerateDAppCode    = vi.fn();
const mockValidateGeneratedHtml = vi.fn(() => null);

vi.mock('../lib/generateCode', () => ({
  generateDAppCode:       (...args: unknown[]) => mockGenerateDAppCode(...args),
  generateEditedDAppCode: vi.fn(),
  validateGeneratedHtml:  (...args: unknown[]) => mockValidateGeneratedHtml(...args),
  buildEditUserPrompt:    vi.fn(),
}));

vi.mock('../lib/navigation', () => ({
  getDashboardUrl: vi.fn(() => 'https://dappgenius.dev'),
}));

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ── Auth helpers ──────────────────────────────────────────────────────────────

const PROFILE_RESPONSE = {
  id:      'user-uuid-test',
  name:    'Test User',
  email:   'testuser@goknown.com',
  sync_id: 'sync-test',
  role:    'user',
};

function makeAuthFetch() {
  return vi.fn().mockImplementation((url: unknown) => {
    if (typeof url === 'string' && url.includes('/profile')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(PROFILE_RESPONSE),
      });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${String(url)}`));
  });
}

function renderDashboardWithAuth() {
  sessionStorage.setItem('dappbuilder:token', 'test-jwt-token');
  global.fetch = makeAuthFetch();
  return render(
    <AuthProvider>
      <BuilderDashboard />
    </AuthProvider>
  );
}

// Wait for auth + initial reloadApps to settle (appsLoading goes false)
async function waitForAuthAndLoad() {
  // currentUser becomes available once auth resolves; My Apps button is always
  // present in the tab list, so we just wait for the initial load to stabilise.
  await waitFor(() => {
    expect(mockLoadSavedApps.mock.calls.length).toBeGreaterThan(0);
  });
  // Give any in-flight state updates time to flush
  await new Promise((r) => setTimeout(r, 0));
}

// ── Wizard helpers ────────────────────────────────────────────────────────────

const CUSTOM_TEMPLATE = TEMPLATES.find((t) => t.id === 'custom') ?? TEMPLATES[0];

function renderWizard(step: 1 | 2 | 3 = 3) {
  return render(
    <CreateDAppWizard
      template={CUSTOM_TEMPLATE}
      workflowSteps={[]}
      onWorkflowChange={vi.fn()}
      wizardStep={step}
      onStepChange={vi.fn()}
      onClose={vi.fn()}
      onSaveApp={vi.fn()}
      currentUserEmail="testuser@goknown.com"
    />
  );
}

// Minimal HTML that satisfies validateGeneratedHtml (mocked to always pass).
const VALID_HTML = [
  '<!DOCTYPE html><html><head><title>Test App</title></head><body>',
  '<button id="btn" onclick="alert(1)">Do Something</button>',
  '<input type="text" placeholder="Enter value" />',
  '<div id="out">Result appears here</div>',
  '<form><button type="submit">Submit</button></form>',
  'x'.repeat(800),
  '</body></html>',
].join('');

// ── Cleanup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Clear all call histories first so no calls bleed between tests.
  vi.clearAllMocks();
  // Restore default implementations after clearing.
  mockLoadSavedApps.mockResolvedValue([]);
  mockSaveApp.mockResolvedValue({ id: 'saved-id-001', dappName: 'Test App' });
  mockUpdateApp.mockResolvedValue({ id: 'saved-id-001', dappName: 'Test App' });
  mockDeleteApp.mockResolvedValue(undefined);
  mockMigrateLocal.mockResolvedValue(undefined);
  mockValidateGeneratedHtml.mockReturnValue(null);
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ── My Apps tab navigation ─────────────────────────────────────────────────────

describe('My Apps tab', () => {
  test('myapps-1: clicking "My Apps" makes the dashboard panel visible', async () => {
    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    // Dashboard pane heading should not be visible on the default tab
    expect(screen.queryByRole('heading', { name: /^my apps$/i, level: 2 })).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /my apps/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^my apps$/i, level: 2 })).toBeTruthy();
    });
  });

  test('myapps-2: My Apps tab button gets aria-selected="true" after being clicked', async () => {
    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    const myAppsBtn = screen.getByRole('tab', { name: /my apps/i });
    expect(myAppsBtn.getAttribute('aria-selected')).toBe('false');

    fireEvent.click(myAppsBtn);

    await waitFor(() => {
      expect(myAppsBtn.getAttribute('aria-selected')).toBe('true');
    });
  });

  test('myapps-3: clicking "My Apps" when authenticated triggers a fresh loadSavedApps call', async () => {
    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    const callsBefore = mockLoadSavedApps.mock.calls.length;
    fireEvent.click(screen.getByRole('tab', { name: /my apps/i }));

    await waitFor(() => {
      expect(mockLoadSavedApps.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  test('myapps-4: handleTabClick calls loadSavedApps (which issues GET /dapp-builder/apps) for authenticated users', async () => {
    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    const callsBefore = mockLoadSavedApps.mock.calls.length;
    fireEvent.click(screen.getByRole('tab', { name: /my apps/i }));

    await waitFor(() => {
      // loadSavedApps proxies to apiJSON('/dapp-builder/apps') when authenticated
      expect(mockLoadSavedApps.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  test('myapps-5: an empty 200 response shows the empty-state message', async () => {
    mockLoadSavedApps.mockResolvedValue([]);
    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    fireEvent.click(screen.getByRole('tab', { name: /my apps/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^my apps$/i, level: 2 })).toBeTruthy();
    });

    // DashboardPane renders empty-state when both myApps and sharedApps are empty
    await waitFor(() => {
      const emptyEl =
        screen.queryByText(/no dapps visible/i) ??
        screen.queryByText(/create new app/i);
      expect(emptyEl).toBeTruthy();
    });
  });

  test('myapps-6: a failed load displays a visible error banner', async () => {
    // First call (mount) succeeds; tab-click triggered call fails
    mockLoadSavedApps
      .mockResolvedValueOnce([])
      .mockRejectedValue(new Error('Network timeout'));

    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    fireEvent.click(screen.getByRole('tab', { name: /my apps/i }));

    await waitFor(() => {
      // apps-error-state div has role="alert"
      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
    });
  });

  test('myapps-7: tab ID is "dashboard" — render condition and aria-selected stay in sync', async () => {
    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    const myAppsBtn = screen.getByRole('tab', { name: /my apps/i });

    // Before click: not selected, panel not shown
    expect(myAppsBtn.getAttribute('aria-selected')).toBe('false');

    fireEvent.click(myAppsBtn);

    // After click: selected AND dashboard content renders
    await waitFor(() => {
      expect(myAppsBtn.getAttribute('aria-selected')).toBe('true');
      expect(screen.getByRole('heading', { name: /^my apps$/i, level: 2 })).toBeTruthy();
    });
  });

  test('myapps-13: a 500 from the backend shows a safe generic message, not a raw error', async () => {
    const { ApiError: AE } = await import('../services/api');
    // Mount succeeds; tab-click returns a 500
    mockLoadSavedApps
      .mockResolvedValueOnce([])
      .mockRejectedValue(new AE(500, 'Internal Server Error: SQL syntax near SELECT', {}));

    renderDashboardWithAuth();
    await waitForAuthAndLoad();

    fireEvent.click(screen.getByRole('tab', { name: /my apps/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      // Safe message shown
      expect(alert.textContent).toMatch(/temporarily unavailable/i);
      // Raw backend message NOT leaked
      expect(alert.textContent).not.toMatch(/sql/i);
      expect(alert.textContent).not.toMatch(/syntax/i);
    });
  });
});

// ── Generation / save error separation ───────────────────────────────────────

describe('CreateDAppWizard generation errors', () => {
  // Fake timers keep the loading setInterval from delaying async state flushing.
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // Click Generate and flush all pending timers + promise microtasks so that
  // React state updates from within handleGenerate are fully processed.
  async function clickGenerate() {
    fireEvent.click(screen.getByRole('button', { name: /generate app/i }));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
  }

  test('myapps-8: successful generation shows live preview and no genError', async () => {
    mockGenerateDAppCode.mockResolvedValue(VALID_HTML);
    mockSaveApp.mockResolvedValue({ id: 'saved-id', dappName: 'Test App' });

    renderWizard();
    await clickGenerate();

    // iframe rendered: title = "<dappName> live app"
    expect(screen.getByTitle(/live app/i)).toBeTruthy();
    expect(screen.queryByText(/we couldn't generate/i)).toBeNull();
  });

  test('myapps-9: a previous genError is cleared when the next generation succeeds', async () => {
    mockGenerateDAppCode.mockRejectedValueOnce(new Error('Connection reset'));
    renderWizard();
    await clickGenerate();

    expect(screen.getByText(/we couldn't generate/i)).toBeTruthy();

    // Retry — second attempt succeeds
    mockGenerateDAppCode.mockResolvedValue(VALID_HTML);
    mockSaveApp.mockResolvedValue({ id: 'saved-id', dappName: 'Test App' });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByText(/we couldn't generate/i)).toBeNull();
    expect(screen.getByTitle(/live app/i)).toBeTruthy();
  });

  test('myapps-10: successful generation + failed save shows preview and only the save-specific error', async () => {
    mockGenerateDAppCode.mockResolvedValue(VALID_HTML);
    mockSaveApp.mockRejectedValue(new Error('Database unavailable'));

    renderWizard();
    await clickGenerate();

    // Preview iframe is rendered
    expect(screen.getByTitle(/live app/i)).toBeTruthy();
    // genError banner is NOT shown (generation succeeded)
    expect(screen.queryByText(/we couldn't generate/i)).toBeNull();
    // saveError banner IS shown with the correct message
    expect(
      screen.getByText(/your app was generated, but it couldn't be saved/i)
    ).toBeTruthy();
  });

  test('myapps-12: failed draft save shows draft-specific wording and no Retry Save button', async () => {
    mockSaveApp.mockRejectedValue(new Error('DB error'));

    // Save Draft is in the step-1 and step-2 footer.
    renderWizard(1);
    const saveDraftBtn = screen.getByRole('button', { name: /save draft/i });
    fireEvent.click(saveDraftBtn);
    await act(async () => { await vi.runAllTimersAsync(); });

    // Draft-specific heading is shown
    expect(screen.getByText(/your draft couldn't be saved/i)).toBeTruthy();
    // Generation-specific heading is NOT shown
    expect(screen.queryByText(/your app was generated, but it couldn't be saved/i)).toBeNull();
    // Retry Save (the generated-app-only action) is NOT shown
    expect(screen.queryByRole('button', { name: /retry save/i })).toBeNull();
    // "Try again" (the draft retry action) IS shown
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  test('myapps-11: Retry Save calls saveApp exactly twice (once per attempt) and does not re-run generateDAppCode', async () => {
    mockGenerateDAppCode.mockResolvedValue(VALID_HTML);
    // First save fails; second (retry) succeeds.
    mockSaveApp
      .mockRejectedValueOnce(new Error('Transient failure'))
      .mockResolvedValueOnce({ id: 'saved-id', dappName: 'Test App' });

    renderWizard();
    await clickGenerate();

    expect(
      screen.getByText(/your app was generated, but it couldn't be saved/i)
    ).toBeTruthy();
    // generateDAppCode called exactly once (for the initial generate)
    expect(mockGenerateDAppCode).toHaveBeenCalledTimes(1);
    // saveApp called exactly once so far (the failed attempt)
    expect(mockSaveApp).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /retry save/i }));
    await act(async () => { await vi.runAllTimersAsync(); });

    // Save error cleared after successful retry
    expect(
      screen.queryByText(/your app was generated, but it couldn't be saved/i)
    ).toBeNull();
    // generateDAppCode still called exactly once — Retry Save never triggers generation
    expect(mockGenerateDAppCode).toHaveBeenCalledTimes(1);
    // saveApp now called exactly twice: the original attempt + the retry
    expect(mockSaveApp).toHaveBeenCalledTimes(2);
  });
});
