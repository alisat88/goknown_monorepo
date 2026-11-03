/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Response } from 'express';

const DATABASE_ERROR_NAMES = new Set([
  'CannotConnectAlreadyConnectedError',
  'ConnectionIsNotSetError',
  'ConnectionNotFoundError',
  'DriverNotConnectedError',
  'QueryRunnerAlreadyReleasedError',
]);

const DATABASE_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETUNREACH',
  'ETIMEDOUT',
  '57P01',
  '57P02',
  '57P03',
]);

export function isDatabaseInfrastructureError(error: any): boolean {
  const name = error && error.name;
  const code = error && error.code;
  const message = error && typeof error.message === 'string' ? error.message : '';

  return (
    DATABASE_ERROR_NAMES.has(name) ||
    DATABASE_ERROR_CODES.has(code) ||
    /driver not connected|connection.*not found|connection.*not established/i.test(
      message,
    )
  );
}

export function databaseUnavailableResponse(response: Response): Response {
  return response.status(503).json({
    error: 'Database temporarily unavailable',
  });
}
