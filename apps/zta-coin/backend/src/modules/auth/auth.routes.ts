import { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { ZtaAuthSessionStore } from './ZtaAuthSessionStore';
import { ZtaHandoffError, ZtaHandoffService } from './ZtaHandoffService';

const router = Router();
const service = new ZtaHandoffService(new ZtaAuthSessionStore(), undefined, {
  dappRedeemUrl: process.env.DAPPGENIUS_HANDOFF_REDEEM_URL,
  dappValidateUrl: process.env.DAPPGENIUS_HANDOFF_VALIDATE_URL,
  serviceToken: process.env.ZTA_HANDOFF_SERVICE_TOKEN,
  clientId: process.env.ZTA_HANDOFF_CLIENT_ID,
  redirectUri: process.env.ZTA_HANDOFF_REDIRECT_URI,
});

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
  const value = request.headers.cookie || '';
  const match = /(?:^|;\s*)zta_session=([^;]+)/.exec(value);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function cookieValue(request: Request, name: string): string | undefined {
  const value = request.headers.cookie || '';
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`).exec(value);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function allowedOrigin(): string | undefined {
  return process.env.DAPPGENIUS_ORIGIN || process.env.ZTA_ALLOWED_ORIGIN;
}

function requireOrigin(request: Request): void {
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

router.use(cors({ origin: allowedOrigin(), credentials: true }));
router.post(
  '/handoff/start',
  errors(async (request, response) => {
    requireOrigin(request);
    const value = startBody(request);
    if (
      value.client_id !== process.env.ZTA_HANDOFF_CLIENT_ID ||
      value.redirect_uri !== process.env.ZTA_HANDOFF_REDIRECT_URI
    ) throw new ZtaHandoffError('Invalid handoff request');
    const transaction = await service.startTransaction();
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
    const result = await service.redeem({
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
    const identity = await service.validate(token);
    response.json({ authenticated: true, expiresAt: identity.expiresAt });
  }),
);
router.post(
  '/logout',
  errors(async (request, response) => {
    requireOrigin(request);
    const token = cookieToken(request);
    if (token) await service.logout(token);
    response
      .clearCookie('zta_session', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
      .status(204)
      .end();
  }),
);

export default router;
