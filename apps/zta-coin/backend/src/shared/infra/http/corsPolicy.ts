import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const publicCors = cors();
// Auth and balance routers own credentialed CORS, including preflight. Keep
// the pre-existing policy for every other endpoint, including locked routes.
export function publicApiCors(request: Request, response: Response, next: NextFunction) {
  if (/^\/auth(?:\/|$)/i.test(request.path) || /^\/me\/balance\/?$/i.test(request.path)) {
    next();
    return;
  }
  publicCors(request, response, next);
}
