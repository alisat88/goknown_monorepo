// Auth middleware for DApp Builder persistence routes.
//
// Semantics differ from the global ensureAuthenticated:
//   - Missing token, invalid signature, or expired token → 401 (unauthenticated)
//   - Authenticated but not authorized → handled downstream by the service (403)
//
// The global ensureAuthenticated returns 403 for all failures.  Changing it
// globally would affect ~100 other routes, so persistence routes use this
// wrapper instead.

import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import AppError from '@shared/errors/AppError';
import authConfig from '@config/auth';

interface ITokenPayload {
  iat: number;
  exp: number;
  sub: string;
}

export default function ensureDappBuilderAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('Authentication required', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, authConfig.jwt.secret);
    const { sub } = decoded as ITokenPayload;
    request.user = { sync_id: sub };
    return next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}
