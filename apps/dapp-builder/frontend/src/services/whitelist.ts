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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

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
 *  1. Invalid email format  → 'Enter a valid email address.'
 *  2. Self-share            → 'You already own this app.'
 *  3. Not a known demo user → 'No demo user found with that email.'
 *  4. Already shared        → 'This user already has access.'
 *  5. No problem            → null
 */
export function getShareValidationError(app: SavedDApp, email: string): string | null {
  const normalized = email.trim().toLowerCase();

  if (!isValidEmailFormat(normalized)) {
    return 'Enter a valid email address.';
  }

  if (normalized === (app.ownerId ?? '').toLowerCase()) {
    return 'You already own this app.';
  }

  if (!isWhitelisted(normalized)) {
    return 'No demo user found with that email.';
  }

  if ((app.sharedWith ?? []).map((e) => e.toLowerCase()).includes(normalized)) {
    return 'This user already has access.';
  }

  return null;
}
