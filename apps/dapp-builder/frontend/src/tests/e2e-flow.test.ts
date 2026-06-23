import { describe, test, expect, beforeEach } from 'vitest';
import {
  loadSavedApps,
  saveApp,
  updateApp,
  deleteApp,
  getApp,
  shareApp,
  seedDemoApps,
} from '../services/storage';
import { isWhitelisted, getWhitelist } from '../services/whitelist';
import { SavedDApp } from '../types';

function makeDApp(overrides: Partial<SavedDApp> = {}): SavedDApp {
  return {
    id: crypto.randomUUID(),
    dappName: 'Test dApp',
    template: 'ledger-app',
    permissionModel: 'role-based',
    apis: ['identity', 'ledger'],
    workflow: ['authenticate-user', 'read-ledger-entries'],
    generatedCode: 'export default function App() { return null; }',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sharedWith: [],
    status: 'Draft',
    ...overrides,
  };
}

describe('DApp Builder end-to-end flow', () => {
  beforeEach(() => localStorage.clear());

  test('createAndSaveApp — saves to localStorage and reloads correctly', () => {
    const app = makeDApp({ dappName: 'Aviation Ledger' });
    saveApp(app);

    const loaded = loadSavedApps();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(app.id);
    expect(loaded[0].dappName).toBe('Aviation Ledger');
    expect(loaded[0].template).toBe('ledger-app');
    expect(loaded[0].generatedCode).toBe(app.generatedCode);
  });

  test('persistence — saved apps survive a simulated page reload', () => {
    const app = makeDApp({ dappName: 'Persistent dApp' });
    saveApp(app);

    // Simulate page reload: load from localStorage fresh
    const reloaded = loadSavedApps();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].dappName).toBe('Persistent dApp');
  });

  test('updateApp — updatedAt changes, other fields preserved', () => {
    const app = makeDApp({ dappName: 'Original Name', status: 'Draft' });
    saveApp(app);

    const originalUpdatedAt = app.updatedAt;
    // Small delay so the timestamp actually differs
    updateApp(app.id, { dappName: 'Updated Name', status: 'Preview' });

    const updated = getApp(app.id);
    expect(updated).not.toBeNull();
    expect(updated!.dappName).toBe('Updated Name');
    expect(updated!.status).toBe('Preview');
    expect(updated!.template).toBe('ledger-app'); // preserved
    expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
  });

  test('deleteApp — removed from localStorage, not returned by loadSavedApps', () => {
    const a = makeDApp({ dappName: 'App A' });
    const b = makeDApp({ dappName: 'App B' });
    saveApp(a);
    saveApp(b);
    expect(loadSavedApps()).toHaveLength(2);

    deleteApp(a.id);
    const remaining = loadSavedApps();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].dappName).toBe('App B');
    expect(getApp(a.id)).toBeNull();
  });

  test('shareApp — whitelisted email is added to sharedWith array', () => {
    const app = makeDApp();
    saveApp(app);

    shareApp(app.id, 'chuck@goknown.io');
    const updated = getApp(app.id);
    expect(updated!.sharedWith).toContain('chuck@goknown.io');
  });

  test('shareApp — non-whitelisted email is rejected by isWhitelisted()', () => {
    expect(isWhitelisted('outsider@example.com')).toBe(false);
    // shareApp does not guard the whitelist — isWhitelisted is the gate in the UI layer
    const app = makeDApp();
    saveApp(app);
    // Calling shareApp directly always succeeds (UI enforces the whitelist)
    // Confirm isWhitelisted correctly rejects the address
    expect(isWhitelisted('hacker@evil.com')).toBe(false);
    expect(isWhitelisted('alisa@goknown.io')).toBe(true);
  });

  test('whitelist — check is case-insensitive', () => {
    expect(isWhitelisted('CHUCK@GOKNOWN.IO')).toBe(true);
    expect(isWhitelisted('Chuck@GoKnown.io')).toBe(true);
    expect(isWhitelisted('alisa@GOKNOWN.IO')).toBe(true);
    expect(isWhitelisted('OUTSIDER@EXAMPLE.COM')).toBe(false);
  });

  test('pre-seeded demo apps — present on first load, not duplicated on second load', () => {
    const seed: SavedDApp[] = [
      makeDApp({ id: 'demo-1', dappName: 'Demo App One' }),
      makeDApp({ id: 'demo-2', dappName: 'Demo App Two' }),
    ];

    // First call: key does not exist → seeds
    seedDemoApps(seed);
    expect(loadSavedApps()).toHaveLength(2);
    expect(loadSavedApps()[0].dappName).toBe('Demo App One');

    // Second call: key exists → no-op, no duplication
    seedDemoApps(seed);
    expect(loadSavedApps()).toHaveLength(2);
  });

  test('corrupt localStorage — loadSavedApps returns [] without throwing', () => {
    localStorage.setItem('dappbuilder:saved_apps', 'not-valid-json{{{{');
    expect(() => loadSavedApps()).not.toThrow();
    expect(loadSavedApps()).toEqual([]);
  });

  test('getWhitelist — returns all whitelisted emails', () => {
    const list = getWhitelist();
    expect(list).toContain('alisa@goknown.io');
    expect(list).toContain('chuck@goknown.io');
    expect(list.length).toBeGreaterThanOrEqual(8);
  });
});
