// DApp Builder API service.
//
// Token lifecycle:
//   AuthContext reads the JWT from the URL fragment on first load and calls
//   setToken() here. Every subsequent call to apiFetch() attaches it as
//   Authorization: Bearer <token>.
//
// Base URL:
//   Resolved from VITE_API_URL (set at build time). Falls back to localhost
//   for local development. Trailing slashes are stripped defensively.

const TOKEN_KEY = 'dappbuilder:token';

export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function getApiBase(): string {
  return (
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3333'
  ).replace(/\/+$/, '');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Authentication required. Please open DApp Builder from your DAppGenius dashboard.') {
    super(message);
    this.name = 'AuthError';
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> ?? {}),
  };
  const url = `${getApiBase()}${path}`;
  return fetch(url, { ...init, headers });
}

export async function apiJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
    const msg = body.error ?? body.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, body);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}
