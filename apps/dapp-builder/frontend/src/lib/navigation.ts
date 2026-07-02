/**
 * Returns the root URL of the DApp Genius app for Back-to-Dashboard navigation.
 *
 * Priority:
 *   1. baseOverride argument — if explicitly empty/whitespace, returns '' (caller handles)
 *   2. VITE_GOKNOWN_URL env var — baked in at build time; set in .env or Render env vars
 *   3. https://dappgenius.dev — production fallback so the button always navigates
 *
 * Normalization applied to all inputs:
 *   - Leading/trailing whitespace is trimmed.
 *   - Trailing slash is stripped.
 *   - Trailing /dashboard (with optional trailing slash) is stripped so accidental
 *     mis-configs (e.g. VITE_GOKNOWN_URL=https://dappgenius.dev/dashboard) still work.
 *
 * For local development against a local GoKnown instance, create .env.local:
 *   VITE_GOKNOWN_URL=http://localhost:3000
 */
export function getDashboardUrl(baseOverride?: string): string {
  if (baseOverride !== undefined) {
    if (!baseOverride.trim()) return '';
    return normalizeBase(baseOverride);
  }
  const base =
    (import.meta.env.VITE_GOKNOWN_URL as string | undefined) ??
    'https://dappgenius.dev';
  return normalizeBase(base);
}

function normalizeBase(url: string): string {
  return url.trim().replace(/\/dashboard\/?$/, '').replace(/\/$/, '');
}
