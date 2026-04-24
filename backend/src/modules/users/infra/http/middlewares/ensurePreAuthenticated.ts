import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import AppError from '@shared/errors/AppError';

import authConfig from '@config/auth';

// interface ITokenPayload {
//   iat: number;
//   exp: number;
//   sub: string;
// }

export default function ensurePreAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authHeader = request.headers.pre_authenticated;
  // console.log(authHeader);
  if (!authHeader) {
    throw new AppError('Pre token is missing', 403);
  }

  try {
    // const decoded = verify(authHeader as string, authConfig.jwt.secret);
    verify(authHeader as string, authConfig.jwt.secret);
    // const { sub } = decoded as ITokenPayload;

    // request.preAuth = { pre_authenticated_id: sub };

    return next();
  } catch {
    throw new AppError('Ivalid Pre token', 403);
  }
}
