import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import AppError from '@shared/errors/AppError';

import authConfig from '@config/auth';

interface ITokenPayload {
  iat: number;
  exp: number;
  sub: string;
  twoFactorAuthentication: boolean;
}

export default function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token is missing', 403);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, authConfig.jwt.secret);

    const { sub, twoFactorAuthentication } = decoded as ITokenPayload;

    // if (!twoFactorAuthentication) {
    //   throw new AppError(
    //     'Access denied. Please contact the system admin.',
    //     401,
    //   );
    // }

    request.user = { sync_id: sub };

    return next();
  } catch (error) {
    throw new AppError(error.message || 'Ivalid JWT token', 403);
  }
}
