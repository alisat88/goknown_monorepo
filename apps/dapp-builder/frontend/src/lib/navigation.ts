/**
 * Returns the URL of the DApp Genius main dashboard.
 *
 * Priority:
 *   1. VITE_GOKNOWN_URL env var (base URL of the DApp Genius app, no trailing slash)
 *   2. Empty string — caller should fall back to window.history.back()
 *
 * Usage:
 *   const url = getDashboardUrl();
 *   if (url) { window.location.href = url; } else { window.history.back(); }
 *
 * Set in .env.local for development, and in the deployment environment for production.
 * Example: VITE_GOKNOWN_URL=https://node1.goknown.app
 */
export function getDashboardUrl(baseOverride?: string): string {
  const base = baseOverride ?? (import.meta.env.VITE_GOKNOWN_URL as string | undefined) ?? '';
  if (!base.trim()) return '';
  return base.replace(/\/$/, '') + '/dashboard';
}
