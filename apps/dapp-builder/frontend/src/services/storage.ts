// TODO (production): Replace all localStorage reads/writes with calls to
// the backend persistence API (e.g. POST /api/dapps, PUT /api/dapps/:id).
// localStorage is used here for demo purposes only.

import { SavedDApp } from '../types';

const STORAGE_KEY = 'dappbuilder:saved_apps';

export function loadSavedApps(): SavedDApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDApp[];
  } catch {
    return [];
  }
}

export function saveApp(app: SavedDApp): void {
  // TODO (production): POST /api/dapps
  const apps = loadSavedApps();
  apps.push(app);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function updateApp(id: string, updates: Partial<SavedDApp>): void {
  // TODO (production): PUT /api/dapps/:id
  const apps = loadSavedApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  apps[idx] = { ...apps[idx], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function deleteApp(id: string): void {
  // TODO (production): DELETE /api/dapps/:id
  const apps = loadSavedApps().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function getApp(id: string): SavedDApp | null {
  return loadSavedApps().find((a) => a.id === id) ?? null;
}

export function shareApp(id: string, email: string): void {
  // TODO (production): POST /api/dapps/:id/share { email }
  const apps = loadSavedApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  const already = apps[idx].sharedWith.map((e) => e.toLowerCase());
  if (already.includes(email.toLowerCase())) return;
  apps[idx] = {
    ...apps[idx],
    sharedWith: [...apps[idx].sharedWith, email.toLowerCase()],
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

/**
 * Seeds demo apps into localStorage on first load only.
 * Checks for the storage key before writing — subsequent calls are no-ops.
 */
export function seedDemoApps(apps: SavedDApp[]): void {
  // TODO (production): Remove entirely — demo data is seeded server-side.
  if (localStorage.getItem(STORAGE_KEY) !== null) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}
