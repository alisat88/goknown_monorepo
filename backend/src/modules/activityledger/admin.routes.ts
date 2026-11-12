import { Router, Request, Response, NextFunction } from 'express';
import { getManager, getRepository } from 'typeorm';
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import User, { EnumRole } from '@modules/users/infra/typeorm/entities/User';
import AppError from '@shared/errors/AppError';

const MAX_PAGE_SIZE = 100;

function parseDate(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)
  ) {
    throw new AppError(`Invalid ${name}`, 400);
  }
  if (!Number.isFinite(Date.parse(value)))
    throw new AppError(`Invalid ${name}`, 400);
  return value;
}

async function currentUser(request: Request): Promise<User> {
  const user = await getRepository(User).findOne({
    where: { sync_id: request.user.sync_id },
  });
  if (!user) throw new AppError('Access denied.', 403);
  return user;
}

async function ensurePlatformAdministrator(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await currentUser(request);
    if (user.role !== EnumRole.Admin)
      return next(new AppError('Access denied.', 403));
    return next();
  } catch (error) {
    return next(error);
  }
}

async function ensureActivityViewer(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await currentUser(request);
    if (user.role === EnumRole.Admin) return next();
    const [grant] = await getManager().query(
      'SELECT 1 FROM activity_log_viewers WHERE user_id=$1',
      [user.id],
    );
    if (!grant) return next(new AppError('Access denied.', 403));
    return next();
  } catch (error) {
    return next(error);
  }
}

const router = Router();
router.use(ensureAuthenticated);

router.get('/access', ensureActivityViewer, (_request, response) => {
  response.json({ allowed: true });
});

router.get('/', ensureActivityViewer, async (request, response, next) => {
  try {
    const query = request.query as Record<string, unknown>;
    const allowed = new Set(['from', 'to', 'user', 'asset', 'limit', 'offset']);
    if (Object.keys(query).some(key => !allowed.has(key))) {
      throw new AppError('Invalid activity log filter', 400);
    }

    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    if (from && to && Date.parse(from) > Date.parse(to)) {
      throw new AppError('Invalid activity date range', 400);
    }
    const limit = query.limit === undefined ? 50 : Number(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)
      throw new AppError('Invalid activity page size', 400);
    if (!Number.isInteger(offset) || offset < 0 || offset > 1000000)
      throw new AppError('Invalid activity offset', 400);

    const values: unknown[] = [];
    const conditions: string[] = [];
    const add = (condition: string, value: unknown) => {
      values.push(value);
      conditions.push(condition.replace('?', `$${values.length}`));
    };
    if (from) add('e.recorded_at >= ?', from);
    if (to) add('e.recorded_at <= ?', to);
    if (query.user !== undefined) {
      if (typeof query.user !== 'string' || query.user.length > 128)
        throw new AppError('Invalid activity user filter', 400);
      add('e.actor_sync_id = ?', query.user);
    }
    if (query.asset !== undefined) {
      if (typeof query.asset !== 'string' || query.asset.length > 128)
        throw new AppError('Invalid activity asset filter', 400);
      add('e.asset_sync_id = ?', query.asset);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitParam = values.length + 1;
    const offsetParam = values.length + 2;
    values.push(limit, offset);
    const rows = await getManager().query(
      `SELECT e.actor_sync_id AS user_id,
              e.asset_sync_id AS asset_id,
              e.event_type,
              e.recorded_at,
              e.outcome,
              (e.metadata->>'estimated_active_ms')::integer AS estimated_active_ms,
              COUNT(*) OVER()::integer AS total_count
         FROM activity_events e
         ${where}
        ORDER BY e.recorded_at DESC, e.id DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );
    const total = rows.length ? rows[0].total_count : 0;
    response.json({
      events: rows.map((row: any) => ({
        user_id: row.user_id,
        asset_id: row.asset_id,
        event_type: row.event_type,
        recorded_at: row.recorded_at,
        estimated_active_ms: row.estimated_active_ms,
        outcome: row.outcome,
      })),
      page: { limit, offset, total },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    console.warn('[activity-ledger-admin] read unavailable');
    return response.status(503).json({ message: 'Activity log unavailable' });
  }
});

router.post(
  '/viewers/:syncId',
  ensurePlatformAdministrator,
  async (request, response, next) => {
    try {
      const syncId = request.params.syncId;
      if (!/^[A-Za-z0-9_.-]{1,128}$/.test(syncId))
        throw new AppError('Invalid viewer', 400);
      const target = await getRepository(User).findOne({
        where: { sync_id: syncId },
      });
      const grantor = await currentUser(request);
      if (!target) throw new AppError('User not found', 404);
      await getManager().query(
        `INSERT INTO activity_log_viewers (user_id, granted_by)
         VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
        [target.id, grantor.id],
      );
      return response.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
);

router.delete(
  '/viewers/:syncId',
  ensurePlatformAdministrator,
  async (request, response, next) => {
    try {
      const syncId = request.params.syncId;
      if (!/^[A-Za-z0-9_.-]{1,128}$/.test(syncId))
        throw new AppError('Invalid viewer', 400);
      const target = await getRepository(User).findOne({
        where: { sync_id: syncId },
      });
      if (!target) throw new AppError('User not found', 404);
      await getManager().query(
        'DELETE FROM activity_log_viewers WHERE user_id=$1',
        [target.id],
      );
      return response.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
