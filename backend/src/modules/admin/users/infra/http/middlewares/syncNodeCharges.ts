/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import AppError from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';

export default async function syncNodeCharges(
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
