// TODO (production): This list is managed by the Permissioning API service
// (/api/permissions/check-access). The hardcoded values here are for demo purposes only.

import { SavedDApp } from '../types';

const WHITELISTED_EMAILS = [
  // GoKnown team
  'alisa@goknown.io',
  'mike@goknown.io',
  'connie@goknown.io',
  'chuck@goknown.io',
  'drlu@goknown.io',
  'drsam@goknown.io',
  'fiona@goknown.io',
  'leo@goknown.io',
  // Demo participants (external)
  'chuck@example.com',
  'fiona@example.com',
  'leo@example.com',
  'hong.liu14@gmail.com',
  'samindu@gmail.com',
  'issoufof@my.erau.edu',
];

export function isWhitelisted(email: string): boolean {
  return WHITELISTED_EMAILS.includes(email.trim().toLowerCase());
}

export function getWhitelist(): string[] {
  return [...WHITELISTED_EMAILS];
}

/**
 * Single source of truth for share validation error messages.
 * Returns the error string if the share attempt is invalid, or null if valid.
 *
 * Checks (in order):
 *  1. Email not in whitelist → 'This email is not a valid user.'
 *  2. Email already on sharedWith list → '… is already on the share list.'
 *  3. No problem → null
 */
export function getShareValidationError(app: SavedDApp, email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!isWhitelisted(normalized)) return 'This email is not a valid user.';
  if (app.sharedWith.map((e) => e.toLowerCase()).includes(normalized)) {
    return `${normalized} is already on the share list.`;
  }
  return null;
}
