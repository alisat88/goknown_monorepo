import AppError from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';

export default async function syncNodeUser(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  // if have sync_id exit middleware, because the node is slave
  if (request.body.masterNode) {
    request.body.masterNode = false;
    return next();
  }

  try {
    request.body.masterNode = true;

    return next();
  } catch (err: any) {
    throw new AppError(err.message);
  }
}
