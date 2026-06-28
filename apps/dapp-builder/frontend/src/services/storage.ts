// TODO (production): Replace all localStorage reads/writes with calls to
// the backend persistence API (e.g. POST /api/dapps, PUT /api/dapps/:id).
// localStorage is used here for demo purposes only.

import { SavedDApp, SharedAccess, ProjectStatus } from '../types';

const STORAGE_KEY = 'dappbuilder:saved_apps';
const SEED_VERSION_KEY = 'dappbuilder:seed_version';
export const CURRENT_SEED_VERSION = '5'; // bump when demo seed schema changes

// Map old status strings to the current lifecycle status enum.
const LEGACY_STATUS_MAP: Record<string, ProjectStatus> = {
  'Preview': 'Saved',
  'Preview Ready': 'Saved',
  'Ready for API mapping': 'Generated',
  'Permission review': 'Permission Review',
};

/** Migrate apps that predate new fields. */
function migrate(raw: Partial<SavedDApp>): SavedDApp {
  const legacyStatus = LEGACY_STATUS_MAP[raw.status as string];
  const id = raw.id ?? `dapp_${crypto.randomUUID()}`;
  return {
    description: '',
    userPrompt: '',
    generatedConfig: '',
    internalAppPath: `/dapp-builder/apps/${id}`,
    ownerName: '',
    version: 1,
    ownerId: '',
    sharedAccess: [],
    ...raw,
    id,
    // Override status only if it's a legacy value
    status: (legacyStatus ?? raw.status ?? 'Draft') as ProjectStatus,
  } as SavedDApp;
}

export function loadSavedApps(): SavedDApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Partial<SavedDApp>[]).map(migrate);
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

export function shareApp(id: string, email: string, access?: SharedAccess): void {
  // TODO (production): POST /api/dapps/:id/share { email, role }
  const apps = loadSavedApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  const already = apps[idx].sharedWith.map((e) => e.toLowerCase());
  const normalized = email.toLowerCase();
  apps[idx] = {
    ...apps[idx],
    sharedWith: already.includes(normalized)
      ? apps[idx].sharedWith
      : [...apps[idx].sharedWith, normalized],
    sharedAccess: access
      ? [
          ...(apps[idx].sharedAccess ?? []).filter((a) => a.email !== normalized),
          { ...access, email: normalized },
        ]
      : apps[idx].sharedAccess ?? [],
    // Upgrade status to Shared when at least one person is shared
    status: 'Shared',
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

/**
 * Seeds demo apps into localStorage. Re-seeds whenever CURRENT_SEED_VERSION changes
 * so demo participants always see up-to-date ownership, sharing, and new fields.
 */
export function seedDemoApps(apps: SavedDApp[]): void {
  // TODO (production): Remove entirely — demo data is seeded server-side.
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (
    localStorage.getItem(STORAGE_KEY) !== null &&
    storedVersion === CURRENT_SEED_VERSION
  ) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
}
