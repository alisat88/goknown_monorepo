// In production, this list is managed by the Permissioning API service
// (/api/permissions/check-access). The hardcoded values here are for
// demo purposes only.

const WHITELISTED_EMAILS = [
  'alisa@goknown.io',
  'mike@goknown.io',
  'connie@goknown.io',
  'chuck@goknown.io',
  'drlu@goknown.io',
  'drsam@goknown.io',
  'fiona@goknown.io',
  'leo@goknown.io',
];

export function isWhitelisted(email: string): boolean {
  return WHITELISTED_EMAILS.includes(email.trim().toLowerCase());
}

export function getWhitelist(): string[] {
  return [...WHITELISTED_EMAILS];
}
