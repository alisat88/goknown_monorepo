import AppError from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { v5 as uuidv5 } from 'uuid';

export default async function voteTransaction(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  // abort transaction so it not loops inside the node from origin
  if (request.body.sync_id) {
    return next();
  }
  try {
    // timestamp
    const timestamp = new Date().getTime();
    // create an unique id concatenating the user id with timestamp
    const id = `${request.user.sync_id}_${new Date().getTime()}`;
    // assign unique id with the unique node key
    const uuid = uuidv5(id || '', process.env.NODE_UUID || '');
    // inject generated Id on body of the request

    request.body.sync_id = uuid;
    request.body.timestamp = timestamp;
    request.body.masterNode = true;

    return next();
  } catch (err: any) {
    throw new AppError(err.message);
  }
}
