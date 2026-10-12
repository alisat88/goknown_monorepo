import { Router, Request, Response } from 'express';

const tokenLockdown = Router();

function denyTokenAccess(_request: Request, response: Response): Response {
  return response.status(403).set('Cache-Control', 'no-store').json({
    code: 'ZTA_OPERATIONS_DISABLED',
    error:
      'ZTA token operations and activity are temporarily unavailable pending secure authorization.',
  });
}

// No current ZTA credential establishes account ownership or issuer authority.
// Deny before legacy authentication, sync middleware, uploads, or services run.
// Do not add a JWT, caller-supplied role, or environment bypass here.
tokenLockdown.use(
  [
    '/mint',
    '/transfer',
    '/ledger',
    '/velocity',
    '/me/transactions',
    '/me/charges',
    '/votes',
    '/admin/users',
    '/auditlogs',
  ],
  denyTokenAccess,
);

// Login reads a legacy balance; registration invokes login; invitations create
// charges and alter transactions. Block before any of those side effects.
tokenLockdown.post(['/sessions', '/users', '/users/invite'], denyTokenAccess);

// These organization operations create or enable legacy token currencies.
tokenLockdown.post('/organizations', denyTokenAccess);
tokenLockdown.put('/organizations/:id', denyTokenAccess);

export default tokenLockdown;
