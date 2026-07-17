import { apiJSON, getToken, AuthError } from './api';
import { SavedDApp, SharedAccess, ProjectStatus } from '../types';

const STORAGE_KEY = 'dappbuilder:saved_apps';
const SEED_VERSION_KEY = 'dappbuilder:seed_version';
const MIGRATED_PREFIX = 'dappbuilder:migrated:';
export const CURRENT_SEED_VERSION = '5'; // bump when demo seed schema changes

// ── Auth / mode checks ────────────────────────────────────────────────────────

function isAuthenticated(): boolean {
  return !!getToken();
}

// localStorage is allowed only in demo mode. In production (VITE_DEMO_MODE not
// set), all storage operations must go through the API. Accessing this via env
// var at call time (not module init) lets Vitest stub it per-test.
function isDemoMode(): boolean {
  return (import.meta.env as Record<string, string | undefined>).VITE_DEMO_MODE === 'true';
}

function requireDemo(): void {
  if (!isDemoMode()) {
    throw new AuthError();
  }
}

// ── Legacy status migration (localStorage path only) ─────────────────────────

const LEGACY_STATUS_MAP: Record<string, ProjectStatus> = {
  'Preview': 'Saved',
  'Preview Ready': 'Saved',
  'Ready for API mapping': 'Generated',
  'Permission review': 'Permission Review',
};

function migrateLocal(raw: Partial<SavedDApp>): SavedDApp {
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
    sharedWith: [],
    sharedAccess: [],
    ...raw,
    id,
    status: (legacyStatus ?? raw.status ?? 'Draft') as ProjectStatus,
  } as SavedDApp;
}

function loadLocalApps(): SavedDApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Partial<SavedDApp>[]).map(migrateLocal);
  } catch {
    return [];
  }
}

function saveLocalApps(apps: SavedDApp[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch { /* storage unavailable */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadSavedApps(): Promise<SavedDApp[]> {
  if (isAuthenticated()) {
    return apiJSON<SavedDApp[]>('/dapp-builder/apps');
  }
  requireDemo();
  return loadLocalApps();
}

export async function saveApp(app: SavedDApp): Promise<SavedDApp> {
  if (isAuthenticated()) {
    return apiJSON<SavedDApp>('/dapp-builder/apps', {
      method: 'POST',
      body: JSON.stringify({
        dapp_name: app.dappName,
        description: app.description,
        user_prompt: app.userPrompt,
        template: app.template,
        permission_model: app.permissionModel,
        apis: app.apis,
        workflow: app.workflow,
        generated_code: app.generatedCode,
        generated_config: app.generatedConfig,
        status: app.status,
        version: app.version,
        client_id: app.id,
      }),
    });
  }
  requireDemo();
  const apps = loadLocalApps();
  apps.push(app);
  saveLocalApps(apps);
  return app;
}

export async function updateApp(
  id: string,
  updates: Partial<SavedDApp>,
): Promise<SavedDApp | null> {
  if (isAuthenticated()) {
    const body: Record<string, unknown> = {};
    if (updates.dappName        !== undefined) body.dapp_name        = updates.dappName;
    if (updates.description     !== undefined) body.description      = updates.description;
    if (updates.userPrompt      !== undefined) body.user_prompt      = updates.userPrompt;
    if (updates.template        !== undefined) body.template         = updates.template;
    if (updates.permissionModel !== undefined) body.permission_model = updates.permissionModel;
    if (updates.apis            !== undefined) body.apis             = updates.apis;
    if (updates.workflow        !== undefined) body.workflow         = updates.workflow;
    if (updates.generatedCode   !== undefined) body.generated_code   = updates.generatedCode;
    if (updates.generatedConfig !== undefined) body.generated_config = updates.generatedConfig;
    if (updates.internalAppPath !== undefined) body.internal_app_path = updates.internalAppPath;
    if (updates.status          !== undefined) body.status           = updates.status;
    if (updates.version         !== undefined) body.version          = updates.version;
    return apiJSON<SavedDApp>(`/dapp-builder/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
  requireDemo();
  const apps = loadLocalApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx] = { ...apps[idx], ...updates, updatedAt: new Date().toISOString() };
  saveLocalApps(apps);
  return apps[idx];
}

export async function deleteApp(id: string): Promise<void> {
  if (isAuthenticated()) {
    await apiJSON<void>(`/dapp-builder/apps/${id}`, { method: 'DELETE' });
    return;
  }
  requireDemo();
  saveLocalApps(loadLocalApps().filter((a) => a.id !== id));
}

export async function getApp(id: string): Promise<SavedDApp | null> {
  if (isAuthenticated()) {
    try {
      return await apiJSON<SavedDApp>(`/dapp-builder/apps/${id}`);
    } catch {
      return null;
    }
  }
  requireDemo();
  return loadLocalApps().find((a) => a.id === id) ?? null;
}

/**
 * Shares the app with the given email at the given role.
 * `access.role` is used when provided; defaults to 'Viewer'.
 */
export async function shareApp(
  id: string,
  email: string,
  access?: SharedAccess,
): Promise<SavedDApp> {
  const role = access?.role ?? 'Viewer';
  if (isAuthenticated()) {
    return apiJSON<SavedDApp>(`/dapp-builder/apps/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }
  requireDemo();
  const apps = loadLocalApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('App not found');
  const normalized = email.toLowerCase();
  const already = apps[idx].sharedWith.map((e) => e.toLowerCase());
  apps[idx] = {
    ...apps[idx],
    sharedWith: already.includes(normalized)
      ? apps[idx].sharedWith
      : [...apps[idx].sharedWith, normalized],
    sharedAccess: [
      ...(apps[idx].sharedAccess ?? []).filter((a) => a.email !== normalized),
      { email: normalized, role: role as SharedAccess['role'] },
    ],
    status: 'Shared',
    updatedAt: new Date().toISOString(),
  };
  saveLocalApps(apps);
  return apps[idx];
}

/**
 * Removes a collaborator from the app.
 * In API mode: `userIdOrEmail` must be the user's UUID PK (from sharedAccess.userId).
 * In localStorage mode: treated as an email string.
 */
export async function removeShare(
  id: string,
  userIdOrEmail: string,
): Promise<SavedDApp> {
  if (isAuthenticated()) {
    return apiJSON<SavedDApp>(`/dapp-builder/apps/${id}/share/${userIdOrEmail}`, {
      method: 'DELETE',
    });
  }
  requireDemo();
  const apps = loadLocalApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('App not found');
  const email = userIdOrEmail.toLowerCase();
  apps[idx] = {
    ...apps[idx],
    sharedWith: apps[idx].sharedWith.filter((e) => e.toLowerCase() !== email),
    sharedAccess: (apps[idx].sharedAccess ?? []).filter((a) => a.email !== email),
    updatedAt: new Date().toISOString(),
  };
  saveLocalApps(apps);
  return apps[idx];
}

/**
 * Seeds demo apps into localStorage. No-op when authenticated (API is source of truth).
 * Re-seeds whenever CURRENT_SEED_VERSION changes so demo participants see up-to-date data.
 */
export function seedDemoApps(apps: SavedDApp[]): void {
  if (isAuthenticated() || !isDemoMode()) return;
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (
    localStorage.getItem(STORAGE_KEY) !== null &&
    storedVersion === CURRENT_SEED_VERSION
  ) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
}

/**
 * One-time migration of owned localStorage apps to the backend API.
 * Idempotent: uses the local app.id as client_id so duplicate POSTs return the
 * existing server record rather than creating duplicates.
 * Completion is tracked per-user in localStorage.
 */
export async function migrateLocalAppsToApi(ownerEmail: string): Promise<void> {
  if (!isAuthenticated()) return;
  const migratedKey = `${MIGRATED_PREFIX}${ownerEmail.toLowerCase()}`;
  if (localStorage.getItem(migratedKey) === 'done') return;

  const localApps = loadLocalApps().filter(
    (a) => a.ownerId?.toLowerCase() === ownerEmail.toLowerCase()
  );

  if (localApps.length === 0) {
    localStorage.setItem(migratedKey, 'done');
    return;
  }

  const results = await Promise.allSettled(
    localApps.map((app) =>
      apiJSON<SavedDApp>('/dapp-builder/apps', {
        method: 'POST',
        body: JSON.stringify({
          dapp_name: app.dappName,
          description: app.description ?? '',
          user_prompt: app.userPrompt ?? '',
          template: app.template,
          permission_model: app.permissionModel,
          apis: app.apis ?? [],
          workflow: app.workflow ?? [],
          generated_code: app.generatedCode ?? '',
          generated_config: app.generatedConfig ?? '',
          status: app.status,
          version: app.version ?? 1,
          client_id: app.id,
        }),
      }),
    ),
  );

  if (results.every((r) => r.status === 'fulfilled')) {
    localStorage.setItem(migratedKey, 'done');
  }
}
