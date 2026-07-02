/**
 * Returns the URL of the DApp Genius main dashboard.
 *
 * Priority:
 *   1. baseOverride argument — if explicitly empty/whitespace, returns '' (caller handles)
 *   2. VITE_GOKNOWN_URL env var — baked in at build time; set in .env or Render env vars
 *   3. https://node1.goknown.app — production fallback so the button always navigates
 *
 * For local development against a local GoKnown instance, create .env.local:
 *   VITE_GOKNOWN_URL=http://localhost:3000
 */
export function getDashboardUrl(baseOverride?: string): string {
  if (baseOverride !== undefined) {
    if (!baseOverride.trim()) return '';
    return baseOverride.replace(/\/$/, '') + '/dashboard';
  }
  const base =
    (import.meta.env.VITE_GOKNOWN_URL as string | undefined) ??
    'https://node1.goknown.app';
  return base.replace(/\/$/, '') + '/dashboard';
}
