import { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { ZtaAuthSessionStore } from './ZtaAuthSessionStore';
import { ZtaHandoffError, ZtaHandoffService } from './ZtaHandoffService';

const router = Router();
export const ztaAuthService = new ZtaHandoffService(new ZtaAuthSessionStore(), undefined, {
  dappRedeemUrl: process.env.DAPPGENIUS_HANDOFF_REDEEM_URL,
  dappValidateUrl: process.env.DAPPGENIUS_HANDOFF_VALIDATE_URL,
  serviceToken: process.env.ZTA_HANDOFF_SERVICE_TOKEN,
  clientId: process.env.ZTA_HANDOFF_CLIENT_ID,
  redirectUri: process.env.ZTA_HANDOFF_REDIRECT_URI,
});

export function ztaSessionToken(request: Request): string | undefined {
  return cookieToken(request);
}

export async function validateZtaSession(token: string) {
  return ztaAuthService.validate(token);
}

function body(request: Request): Record<string, string> {
  const value = request.body;
  const keys = ['code', 'client_id', 'redirect_uri', 'state', 'code_verifier'];
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some(key => typeof value[key] !== 'string' || !value[key] || value[key].length > 2048)
  ) {
    throw new ZtaHandoffError('Invalid handoff request');
  }
  return value;
}

function startBody(request: Request): Record<string, string> {
  const value = request.body;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    typeof value.client_id !== 'string' ||
    typeof value.redirect_uri !== 'string'
  ) throw new ZtaHandoffError('Invalid handoff request');
  return value;
}

function cookieToken(request: Request): string | undefined {
  return cookieValue(request, 'zta_session');
}

// Reject ambiguous duplicates, invalid encoding, and invalid opaque-token syntax.
// Both session and browser-transaction cookies use this fail-closed parser.
function cookieValue(request: Request, name: string): string | undefined {
  const values = (request.headers.cookie || '').split(';')
    .map(part => part.trim())
    .filter(part => part === name || part.startsWith(`${name}=`));
  if (!values.length) return undefined;
  try {
    if (values.length !== 1 || !values[0].startsWith(`${name}=`)) throw new Error();
    const value = decodeURIComponent(values[0].slice(name.length + 1));
    const pattern = name === 'zta_session'
      ? /^zta1_[A-Za-z0-9_-]{43}$/ : /^ztat_[A-Za-z0-9_-]{43}$/;
    if (!pattern.test(value)) throw new Error();
    return value;
  } catch {
    throw new ZtaHandoffError('Authentication required');
  }
}

function allowedOrigin(): string | undefined {
  return process.env.ZTA_ALLOWED_ORIGIN || process.env.DAPPGENIUS_ORIGIN;
}

export function requireOrigin(request: Request): void {
  const origin = request.header('Origin');
  const allowed = allowedOrigin();
  if (origin && (!allowed || origin !== allowed)) {
    throw new ZtaHandoffError('Origin not allowed');
  }
}

function errors(action: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, _next: NextFunction): void => {
    void action(request, response).catch(error => {
      response
        .status(error instanceof ZtaHandoffError ? 401 : 503)
        .set('Cache-Control', 'no-store')
        .json({ error: error instanceof ZtaHandoffError ? error.message : 'Authentication unavailable' });
    });
  };
}

export const ztaBrowserCors = cors({ origin: allowedOrigin() || false, credentials: true });
router.use(ztaBrowserCors);
router.use((_request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });
router.post(
  '/handoff/start',
  errors(async (request, response) => {
    requireOrigin(request);
    const value = startBody(request);
    if (
      value.client_id !== process.env.ZTA_HANDOFF_CLIENT_ID ||
      value.redirect_uri !== process.env.ZTA_HANDOFF_REDIRECT_URI
    ) throw new ZtaHandoffError('Invalid handoff request');
    const transaction = await ztaAuthService.startTransaction();
    response
      .cookie('zta_handoff_tx', transaction.transactionCookie, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 300000,
      } as any)
      .json({
        state: transaction.state,
        codeVerifier: transaction.codeVerifier,
        clientId: transaction.clientId,
        redirectUri: transaction.redirectUri,
        expiresInSeconds: transaction.expiresInSeconds,
      });
  }),
);
router.post(
  '/handoff/redeem',
  errors(async (request, response) => {
    requireOrigin(request);
    const value = body(request);
    const transactionCookie = cookieValue(request, 'zta_handoff_tx');
    if (!transactionCookie) throw new ZtaHandoffError('Invalid or expired handoff');
    const result = await ztaAuthService.redeem({
      code: value.code,
      clientId: value.client_id,
      redirectUri: value.redirect_uri,
      state: value.state,
      codeVerifier: value.code_verifier,
      transactionCookie,
    });
    response
      .cookie('zta_session', result.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600000,
      } as any)
      .clearCookie('zta_handoff_tx', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
      .status(204)
      .end();
  }),
);
router.get(
  '/session',
  errors(async (request, response) => {
    requireOrigin(request);
    const token = cookieToken(request);
    if (!token) throw new ZtaHandoffError('Authentication required');
    const identity = await ztaAuthService.validate(token);
    response.json({ authenticated: true, expiresAt: identity.expiresAt });
  }),
);
router.post(
  '/logout',
  errors(async (request, response) => {
    requireOrigin(request);
    const token = cookieToken(request);
    if (token) await ztaAuthService.logout(token);
    response
      .clearCookie('zta_session', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
      .status(204)
      .end();
  }),
);

export default router;
