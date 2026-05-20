import AppError from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { v5 as uuidv5 } from 'uuid';

export default async function ç(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  // if have sync_id exit middleware, because the node is slave
  if (request.body.sync_id) {
    request.body.masterNode = false;
    return next();
  }

  try {
    // generate unic uuid
    // create buffer with user email + timestamp
    const name = request.file
      ? request.file.filename
      : request.body.folder_sync_id;
    const id = `${name}_${new Date().getTime()}`;

    const uuid = uuidv5(id || '', process.env.NODE_UUID || '');

    request.body.sync_id = uuid;
    request.body.masterNode = true;

    return next();
  } catch (err: any) {
    throw new AppError(err.message);
  }
}
