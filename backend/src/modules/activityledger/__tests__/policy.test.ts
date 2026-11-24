import 'reflect-metadata';
import {
  estimatedInterval,
  fingerprint,
  unionIntervalMs,
  validateBody,
} from '../policy';
import FindDigitalAssetsService from '@modules/digitalassets/services/FindDigitalAssetsService';

const request_id = '10000000-0000-4000-8000-000000000001';
test('start accepts only request ID, never actor, metadata or payload', () => {
  expect(validateBody({ request_id }, 'start')).toEqual({ request_id });
  for (const key of [
    'actor_user_id',
    'asset_id',
    'duration',
    'metadata',
    'token',
    'url',
    'filename',
    'password',
  ]) {
    expect(() =>
      validateBody({ request_id, [key]: 'secret' }, 'start'),
    ).toThrow();
  }
});
test.each([
  [{ sequence: 1, elapsed_ms: 15000, reason: 'heartbeat' }, 'heartbeat'],
  [{ sequence: 2, elapsed_ms: 2000, reason: 'hidden' }, 'end'],
])('allows narrow observations %j', (body, action) =>
  expect(validateBody(body, action as any)).toEqual(body),
);
test.each([
  { sequence: -1, elapsed_ms: 10, reason: 'heartbeat' },
  { sequence: 1, elapsed_ms: -10, reason: 'heartbeat' },
  { sequence: 1, elapsed_ms: Infinity, reason: 'heartbeat' },
  { sequence: 1, elapsed_ms: 10, reason: 'asset.downloaded' },
  { sequence: 1, elapsed_ms: 10, reason: 'heartbeat', actor: 'spoof' },
])('rejects invalid observation %j', body =>
  expect(() => validateBody(body, 'heartbeat')).toThrow(),
);
test.each([
  [15000, 15000, 15000],
  [12000, 15000, 12000],
  [21000, 15000, 0],
  [15000, 21000, 0],
  [-1, 10, 0],
  [15000, 0, 0],
])('bounds server/client interval %i %i', (server, client, expected) =>
  expect(estimatedInterval(server, client)).toBe(expected),
);
test.each(['offline', 'idle', 'sleep', 'error', 'hidden', 'pagehide'])(
  'terminal reason %s receives no active-time credit', reason => {
    expect(estimatedInterval(15000, 15000, reason)).toBe(0);
  },
);
test('overlapping tabs use interval union, not sum', () => {
  expect(
    unionIntervalMs([
      [0, 15000],
      [10000, 20000],
      [25000, 30000],
    ]),
  ).toBe(25000);
});
test('normalized retries fingerprint consistently, differing content conflicts', () => {
  const a = validateBody(
    { sequence: 1, elapsed_ms: 15, reason: 'heartbeat' },
    'heartbeat',
  );
  const b = validateBody(
    { reason: 'heartbeat', elapsed_ms: 15, sequence: 1 },
    'heartbeat',
  );
  expect(fingerprint('heartbeat', a)).toBe(fingerprint('heartbeat', b));
  expect(fingerprint('end', a)).not.toBe(fingerprint('heartbeat', a));
});
test('existing preview authorization denies private asset to a different user', async () => {
  const assets: any = {
    findBySyncId: jest
      .fn()
      .mockResolvedValue({ id: 'asset', user_id: 'owner', privacy: 'private' }),
  };
  const users: any = {
    findBySyncId: jest.fn().mockResolvedValue({ id: 'other' }),
  };
  await expect(
    new FindDigitalAssetsService(assets, users).execute(
      'asset-sync',
      'actor-sync',
    ),
  ).rejects.toMatchObject({ statusCode: 403 });
});
