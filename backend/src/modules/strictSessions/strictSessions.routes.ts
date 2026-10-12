import { Router, Request, Response, NextFunction } from 'express';
import { StrictSessionService, StrictAuthError } from './StrictSessionService';
import { PostgresStrictStore } from './PostgresStrictStore';
import { container } from 'tsyringe';
import path from 'path';
import IMailProvider from '@shared/container/providers/MailProvider/models/IMailProvider';
import { digest } from './StrictSessionService';
import { PostgresZtaHandoffStore } from './PostgresZtaHandoffStore';
import { ZtaHandoffService } from './ZtaHandoffService';

function bearer(request: Request): string {
  const match = /^Bearer (dgs1_[A-Za-z0-9_-]{43})$/.exec(
    request.headers.authorization || '',
  );
  if (!match) throw new StrictAuthError(401, 'Strict authentication required');
  return match[1];
}
function handle(
  action: (request: Request, response: Response) => Promise<unknown>,
) {
  return (request: Request, response: Response, _next: NextFunction): void => {
    void action(request, response).catch(error => {
      const known = error instanceof StrictAuthError;
      response
        .status(known ? error.status : 503)
        .json({
          error: known ? error.message : 'Strict authentication unavailable',
        });
    });
  };
}
// Only new routes use this middleware; never sets legacy request.user.sync_id.
export function ensureStrictSession(service: StrictSessionService) {
  return (request: Request, response: Response, next: NextFunction): void => {
    void (async () => {
      const token = bearer(request);
      response.locals.strictIdentity = await service.validate(token);
      response.locals.strictSessionHash = digest(token);
      next();
    })().catch(error => {
      const known = error instanceof StrictAuthError;
      response
        .status(known ? error.status : 503)
        .json({
          error: known ? error.message : 'Strict authentication unavailable',
        });
    });
  };
}
function body(request: Request, keys: string[]): Record<string, string> {
  const value = request.body;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some(
      key =>
        typeof value[key] !== 'string' ||
        !value[key] ||
        value[key].length > 1024,
    )
  ) {
    throw new StrictAuthError(400, 'Invalid request');
  }
  return value;
}
export function createStrictSessionsRouter(
  service: StrictSessionService,
  enabled = () => process.env.STRICT_SESSIONS_ENABLED === 'true',
) {
  const router = Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    if (!enabled()) {
      response.sendStatus(404);
      return;
    }
    if (Object.keys(request.query).length) {
      response.status(400).json({ error: 'Invalid request' });
      return;
    }
    next();
  });
  router.post(
    '/challenges',
    handle(async (request, response) => {
      const { email, password } = body(request, ['email', 'password']);
      response.status(201).json(await service.start(email, password));
    }),
  );
  const handoff = new ZtaHandoffService(new PostgresZtaHandoffStore(), {
    clientId: process.env.ZTA_HANDOFF_CLIENT_ID,
    redirectUri: process.env.ZTA_HANDOFF_REDIRECT_URI,
  });
  router.post(
    '/handoff/authorize',
    ensureStrictSession(service),
    handle(async (request, response) => {
      const { client_id, redirect_uri, state, code_challenge } = body(
        request,
        ['client_id', 'redirect_uri', 'state', 'code_challenge'],
      );
      response.status(201).json(
        await handoff.issue(
          response.locals.strictIdentity.userId,
          response.locals.strictSessionHash,
          {
            clientId: client_id,
            redirectUri: redirect_uri,
            state,
            codeChallenge: code_challenge,
          },
        ),
      );
    }),
  );
  router.post(
    '/handoff/redeem',
    handle(async (request, response) => {
      const expected = process.env.ZTA_HANDOFF_SERVICE_TOKEN;
      const supplied = request.header('X-ZTA-Handoff-Token') || '';
      if (!expected || supplied.length !== expected.length) {
        throw new StrictAuthError(401, 'Handoff service authentication required');
      }
      const left = Buffer.from(supplied);
      const right = Buffer.from(expected);
      if (!require('crypto').timingSafeEqual(left, right)) {
        throw new StrictAuthError(401, 'Handoff service authentication required');
      }
      const { code, client_id, redirect_uri, state, code_verifier } = body(
        request,
        ['code', 'client_id', 'redirect_uri', 'state', 'code_verifier'],
      );
      response.json(
        await handoff.redeem({
          code,
          clientId: client_id,
          redirectUri: redirect_uri,
          state,
          codeVerifier: code_verifier,
        }),
      );
    }),
  );
  router.post(
    '/handoff/validate-parent',
    handle(async (request, response) => {
      const expected = process.env.ZTA_HANDOFF_SERVICE_TOKEN;
      const supplied = request.header('X-ZTA-Handoff-Token') || '';
      if (!expected || supplied.length !== expected.length) {
        throw new StrictAuthError(401, 'Handoff service authentication required');
      }
      const left = Buffer.from(supplied);
      const right = Buffer.from(expected);
      if (!require('crypto').timingSafeEqual(left, right)) {
        throw new StrictAuthError(401, 'Handoff service authentication required');
      }
      const value = request.body;
      if (!value || Object.keys(value).length !== 1 || typeof value.parent_session_hash !== 'string') {
        throw new StrictAuthError(400, 'Invalid request');
      }
      response.json({ valid: await handoff.validateParent(value.parent_session_hash) });
    }),
  );
  router.post(
    '/verify',
    handle(async (request, response) => {
      const { challenge, code } = body(request, ['challenge', 'code']);
      response.json(await service.verify(challenge, code));
    }),
  );
  router.get('/current', ensureStrictSession(service), (_request, response) => {
    response.json({
      authenticated: true,
      expiresAt: response.locals.strictIdentity.expiresAt,
    });
  });
  router.post(
    '/logout',
    handle(async (request, response) => {
      if (request.body && Object.keys(request.body).length)
        throw new StrictAuthError(400, 'Invalid request');
      await service.logout(bearer(request));
      response.sendStatus(204);
    }),
  );
  return router;
}

const service = new StrictSessionService(
  new PostgresStrictStore(),
  async (email, code) => {
    // Do not reuse SendLoginEmailCodeService: its bypass mode logs codes.
    // Resolve lazily; disabled strict routes have no new startup requirements.
    if (
      process.env.MAIL_BYPASS === 'true' ||
      !['smtp', 'ses'].includes(process.env.MAIL_DRIVER || '')
    ) {
      throw new StrictAuthError(
        503,
        'Strict verification delivery unavailable',
      );
    }
    const mail = container.resolve<IMailProvider>('MailProvider');
    await mail.sendMail({
      to: { email, name: 'DAppGenius user' },
      subject: '[DAppGenius] Strict login verification',
      templateData: {
        file: path.resolve(__dirname, 'strict-code.hbs'),
        variables: { code },
      },
    });
  },
);
export default createStrictSessionsRouter(service);
