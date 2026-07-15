// Sharing authorization is independent of DEMO_USERS.
// Source of truth: the Render/backend permission service.
// This static list is the frontend development/demo fallback only — it must contain
// exactly the same ten addresses that are authorized in the backend.

import { SavedDApp } from '../types';

const WHITELISTED_EMAILS: string[] = [
  'cgardner@enterprise-kc.com',
  'leopoldojacobsen@gmail.com',
  'mharold@goknown.com',
  'cerlanger@goknown.com',
  'atiselska@goknown.com',
  'ed.bohlke@gmail.com',
  'ilene@tanendirected.com',
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
 *  1. Invalid email format         → 'Enter a valid email address.'
 *  2. Self-share                   → 'You already own this app.'
 *  3. Not an authorized recipient  → 'This email is not authorized for sharing.'
 *  4. Already shared               → 'This user already has access.'
 *  5. No problem                   → null
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
    return 'This email is not authorized for sharing.';
  }

  if ((app.sharedWith ?? []).map((e) => e.toLowerCase()).includes(normalized)) {
    return 'This user already has access.';
  }

  return null;
}
