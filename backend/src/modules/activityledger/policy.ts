import { createHash } from 'crypto';
import AppError from '@shared/errors/AppError';

export const MAX_INTERVAL_MS = 20000;
export const EXPIRY_MS = 45000;
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type Observation = {
  sequence: number;
  elapsed_ms: number;
  reason: string;
};
const endReasons = [
  'hidden',
  'offline',
  'idle',
  'navigation',
  'pagehide',
  'error',
  'sleep',
];
export function validateBody(
  body: any,
  action: 'start' | 'heartbeat' | 'end',
): any {
  const keys =
    action === 'start' ? ['request_id'] : ['sequence', 'elapsed_ms', 'reason'];
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length !== keys.length ||
    Object.keys(body).some(k => !keys.includes(k))
  ) {
    throw new AppError('Invalid activity observation', 400);
  }
  if (action === 'start') {
    if (typeof body.request_id !== 'string' || !UUID.test(body.request_id))
      throw new AppError('Invalid request ID', 400);
    return { request_id: body.request_id.toLowerCase() };
  }
  if (
    !Number.isSafeInteger(body.sequence) ||
    body.sequence < 1 ||
    body.sequence > 2147483646 ||
    !Number.isSafeInteger(body.elapsed_ms) ||
    body.elapsed_ms < 0 ||
    body.elapsed_ms > 86400000 ||
    !(action === 'heartbeat' ? ['heartbeat'] : endReasons).includes(body.reason)
  ) {
    throw new AppError('Invalid activity observation', 400);
  }
  return {
    sequence: body.sequence,
    elapsed_ms: body.elapsed_ms,
    reason: body.reason,
  };
}
export function fingerprint(action: string, body: object): string {
  return createHash('sha256')
    .update(JSON.stringify([action, body]))
    .digest('hex');
}
// A long server OR client gap earns zero. Never bridge a sleep/offline interval.
const zeroCreditReasons = new Set([
  'offline',
  'idle',
  'sleep',
  'error',
  'hidden',
  'pagehide',
]);

export function estimatedInterval(
  serverMs: number,
  clientMs: number,
  reason = 'heartbeat',
): number {
  if (zeroCreditReasons.has(reason)) return 0;
  if (
    serverMs < 0 ||
    serverMs > MAX_INTERVAL_MS ||
    clientMs > MAX_INTERVAL_MS ||
    clientMs < 0
  )
    return 0;
  return Math.floor(Math.min(serverMs, clientMs));
}
// Use on complete interval sets, never sum per-tab totals. A paginated event page
// is not a complete rollup and the read endpoint deliberately exposes no total.
export function unionIntervalMs(intervals: Array<[number, number]>): number {
  let end = -Infinity;
  let total = 0;
  for (const [start, stop] of [...intervals].sort((a, b) => a[0] - b[0])) {
    if (stop > start) {
      total += Math.max(0, stop - Math.max(start, end));
      end = Math.max(end, stop);
    }
  }
  return total;
}
