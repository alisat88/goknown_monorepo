// TODO (production): This list is managed by the Permissioning API service
// (/api/permissions/check-access). The hardcoded values here are for demo purposes only.

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
