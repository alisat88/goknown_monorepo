import AppError from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4, v5 as uuidv5, validate as uuidValidate } from 'uuid';

export default async function createSyncIdUser(
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
    const id = `${request.body.email}_${new Date().getTime()}`;
    const nodeNamespace = process.env.NODE_UUID;
    const uuid =
      nodeNamespace && uuidValidate(nodeNamespace)
        ? uuidv5(id || '', nodeNamespace)
        : uuidv4();

    request.body.sync_id = uuid;
    request.body.masterNode = true;

    return next();
  } catch (err: any) {
    throw new AppError(err.message);
  }
}
