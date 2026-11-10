import rateLimit from 'express-rate-limit';
import { Router, Request, Response, NextFunction } from 'express';
import { getManager, getRepository } from 'typeorm';
import { container } from 'tsyringe';
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import FindDigitalAssetsService from '@modules/digitalassets/services/FindDigitalAssetsService';
import User from '@modules/users/infra/typeorm/entities/User';
import AppError from '@shared/errors/AppError';
import { ActivityLedger, Identity } from './ActivityLedger';
import { UUID, validateBody } from './policy';

export async function authorizePreview(
  actor: string,
  asset: string,
): Promise<Identity> {
  const resolved = await container
    .resolve(FindDigitalAssetsService)
    .execute(asset, actor);
  if (!resolved) throw new AppError('Digital asset not found', 404);
  const user = await getRepository(User).findOne({ where: { sync_id: actor } });
  if (!user) throw new AppError('User not found', 403);
  return {
    actor_user_id: user.id,
    actor_sync_id: user.sync_id,
    asset_id: resolved.id,
    asset_sync_id: resolved.sync_id,
  };
}

const router = Router();
router.use((req, res, next) => {
  if (process.env.ACTIVITY_LEDGER_ENABLED !== 'true')
    return res.status(404).json({ message: 'Activity capture disabled' });
  return next();
});
router.use(ensureAuthenticated);
router.use(
  rateLimit({
    windowMs: 60000,
    limit: 180,
    keyGenerator: req => req.user.sync_id,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Activity observation rate exceeded' },
  }),
);
const ledger = () =>
  new ActivityLedger(
    getManager(),
    authorizePreview,
    process.env.ACTIVITY_LEDGER_SOURCE_NODE || 'local',
  );
const handle =
  (fn: (req: Request, res: Response) => Promise<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof AppError) return next(error);
      // Never pass database errors/parameters through the existing global logger.
      console.warn('[activity-ledger] persistence unavailable');
      res.status(503).json({ message: 'Activity capture unavailable' });
    }
  };
router.post(
  '/assets/:asset/access-sessions',
  handle(async (req, res) => {
    const body = validateBody(req.body, 'start');
    res.json(
      await ledger().start(req.user.sync_id, req.params.asset, body.request_id),
    );
  }),
);
for (const action of ['heartbeat', 'end'] as const) {
  router.post(
    `/assets/:asset/access-sessions/:session/${action}`,
    handle(async (req, res) => {
      if (!UUID.test(req.params.session))
        throw new AppError('Invalid session', 400);
      const body = validateBody(req.body, action);
      res.json(
        await ledger().observe(
          req.user.sync_id,
          req.params.asset,
          req.params.session,
          action,
          body,
        ),
      );
    }),
  );
}
router.get(
  '/events',
  handle(async (req, res) => {
    if (
      Object.keys(req.query).some(
        k => !['limit', 'before_at', 'before_id'].includes(k),
      )
    )
      throw new AppError('Invalid query', 400);
    const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new AppError('Invalid limit', 400);
    const { before_at: at, before_id: id } = req.query;
    let before;
    if (at !== undefined || id !== undefined) {
      if (
        typeof at !== 'string' ||
        !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(at) ||
        !Number.isFinite(Date.parse(at)) ||
        typeof id !== 'string' ||
        !UUID.test(id)
      )
        throw new AppError('Invalid cursor', 400);
      before = { at, id };
    }
    const user = await getRepository(User).findOne({
      where: { sync_id: req.user.sync_id },
    });
    if (!user) throw new AppError('User not found', 403);
    const history = await ledger().list(user.id, limit, before);
    const { events } = history;
    const last = events[events.length - 1];
    res.json({
      events,
      incomplete_sessions: history.incomplete_sessions,
      next_cursor:
        events.length === limit
          ? { before_at: last.recorded_at.toISOString(), before_id: last.id }
          : null,
      measurement: 'ESTIMATED ACTIVE PREVIEW TIME',
      coverage: 'best-effort authenticated in-app previews',
    });
  }),
);
export default router;
