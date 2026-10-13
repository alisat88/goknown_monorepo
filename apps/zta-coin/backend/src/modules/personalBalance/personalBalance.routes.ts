import { Router, Request, Response } from 'express';
import { ztaSessionToken, validateZtaSession } from '@modules/auth/auth.routes';
import { ZtaPersonalBalanceService, PostgresPersonalBalanceStore } from './ZtaPersonalBalanceService';

export function createPersonalBalanceRouter(
  service: ZtaPersonalBalanceService,
  validateSession: (token: string) => Promise<{ userId: string }>,
) {
  const router = Router();
  router.get('/', async (request: Request, response: Response) => {
    if (Object.keys(request.query).length) {
      response.status(400).set('Cache-Control', 'no-store').json({ error: 'Invalid request' });
      return;
    }
    const token = ztaSessionToken(request);
    if (!token) {
      response.status(401).set('Cache-Control', 'no-store').json({ error: 'Authentication required' });
      return;
    }
    try {
      const identity = await validateSession(token);
      const balance = await service.getBalance(identity.userId);
      response.set('Cache-Control', 'no-store').json(balance);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const status = message === 'Authentication required' ? 401 : 503;
      response.status(status).set('Cache-Control', 'no-store').json({
        error: status === 401 ? 'Authentication required' : 'Balance service unavailable',
      });
    }
  });
  return router;
}

const router = createPersonalBalanceRouter(
  new ZtaPersonalBalanceService(new PostgresPersonalBalanceStore()),
  validateZtaSession,
);

export default router;
