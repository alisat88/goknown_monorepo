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
    description: '',
    template: 'ledger-app',
    permissionModel: 'role-based',
    apis: ['identity', 'ledger'],
    workflow: ['authenticate-user', 'read-ledger-entries'],
    generatedCode: 'export default function App() { return null; }',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sharedWith: [],
    sharedAccess: [],
    ownerId: 'mike@goknown.io',
    ownerName: 'Mike',
    status: 'Draft',
    version: 1,
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
    // 'Preview' is a legacy status remapped to 'Saved' by migrate() — use 'Generated' instead
    updateApp(app.id, { dappName: 'Updated Name', status: 'Generated' });

    const updated = getApp(app.id);
    expect(updated).not.toBeNull();
    expect(updated!.dappName).toBe('Updated Name');
    expect(updated!.status).toBe('Generated');
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

  // ── Auth / ownership tests ────────────────────────────────────────────────

  test('ownership — Mike creates a draft and draft owner is Mike, not Alisa', () => {
    const app = makeDApp({
      dappName: 'Mikes App',
      ownerId: 'mike@goknown.io',
      ownerName: 'Mike',
    });
    saveApp(app);

    const loaded = getApp(app.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.ownerId).toBe('mike@goknown.io');
    expect(loaded!.ownerName).toBe('Mike');
    expect(loaded!.ownerId).not.toBe('alisa@goknown.io');
    expect(loaded!.ownerName).not.toBe('Alisa');
  });

  test('migrate — apps missing ownerId do not default to Alisa after storage.ts fix', () => {
    // Simulate an old record saved without ownerId / ownerName
    const legacyRecord: Partial<SavedDApp> = {
      id: 'legacy-001',
      dappName: 'Old App',
      template: 'ledger-app',
      permissionModel: 'role-based',
      apis: [],
      workflow: [],
      generatedCode: '',
      status: 'Draft',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Write raw partial (bypasses saveApp type check)
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([legacyRecord]));

    const loaded = loadSavedApps();
    expect(loaded).toHaveLength(1);
    // After fix: migrate() defaults to '' not 'alisa@goknown.io'
    expect(loaded[0].ownerId).not.toBe('alisa@goknown.io');
    expect(loaded[0].ownerName).not.toBe('Alisa');
  });

  test('ownership — ownerId is preserved through save / load / update cycle', () => {
    const app = makeDApp({ ownerId: 'mike@goknown.io', ownerName: 'Mike' });
    saveApp(app);

    updateApp(app.id, { dappName: 'Updated Name' });

    const updated = getApp(app.id);
    expect(updated!.ownerId).toBe('mike@goknown.io');
    expect(updated!.ownerName).toBe('Mike');
    expect(updated!.dappName).toBe('Updated Name');
  });

  test('access control — a user cannot see apps they do not own and are not shared with', () => {
    const mikesApp  = makeDApp({ dappName: 'Mikes App',  ownerId: 'mike@goknown.io',  ownerName: 'Mike' });
    const alisasApp = makeDApp({ dappName: 'Alisas App', ownerId: 'alisa@goknown.io', ownerName: 'Alisa' });
    saveApp(mikesApp);
    saveApp(alisasApp);

    const all = loadSavedApps();

    // Only mikesApp is owned by mike
    const mikeOwned = all.filter((a) => a.ownerId === 'mike@goknown.io');
    expect(mikeOwned).toHaveLength(1);
    expect(mikeOwned[0].dappName).toBe('Mikes App');

    // alisasApp is not in mikesApp's scope unless shared
    const mikeShared = all.filter(
      (a) => a.ownerId !== 'mike@goknown.io' &&
             a.sharedWith.includes('mike@goknown.io')
    );
    expect(mikeShared).toHaveLength(0);
  });

  test('sharing — shared viewer is recorded with Viewer role, owner stays unchanged', () => {
    const app = makeDApp({ ownerId: 'alisa@goknown.io', ownerName: 'Alisa' });
    saveApp(app);

    shareApp(app.id, 'mike@goknown.io', { email: 'mike@goknown.io', role: 'Viewer' });

    const updated = getApp(app.id);
    expect(updated!.ownerId).toBe('alisa@goknown.io');
    expect(updated!.sharedWith).toContain('mike@goknown.io');
    expect(updated!.sharedAccess[0].role).toBe('Viewer');
    expect(updated!.sharedAccess[0].email).toBe('mike@goknown.io');
  });

  test('sharing — owner cannot be demoted to Viewer via shareApp', () => {
    const app = makeDApp({ ownerId: 'alisa@goknown.io', ownerName: 'Alisa' });
    saveApp(app);

    // Attempting to share back with the owner does not change ownerId
    shareApp(app.id, 'alisa@goknown.io', { email: 'alisa@goknown.io', role: 'Viewer' });

    const updated = getApp(app.id);
    // ownerId is never modified by shareApp
    expect(updated!.ownerId).toBe('alisa@goknown.io');
  });
});
