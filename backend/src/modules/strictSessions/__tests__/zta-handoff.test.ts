import { createHash } from 'crypto';

import {
  HandoffStore,
  ZtaHandoffService,
} from '../ZtaHandoffService';

const verifier = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012';
const challenge = createHash('sha256').update(verifier).digest('base64url');

class MemoryHandoffStore implements HandoffStore {
  row: any;
  consumed = false;
  parentIsValid = true;
  private redeeming = false;

  async issue(input: any): Promise<void> {
    this.row = { ...input, consumed_at: null };
  }

  async redeem(input: any): Promise<any> {
    if (this.redeeming) return undefined;
    this.redeeming = true;
    try {
      if (
        !this.row ||
        this.consumed ||
        this.row.codeHash !== input.codeHash ||
        this.row.clientId !== input.clientId ||
        this.row.redirectUri !== input.redirectUri ||
        this.row.stateHash !== input.stateHash ||
        this.row.codeChallenge !== createHash('sha256').update(input.codeVerifier).digest('base64url') ||
        !this.parentIsValid
      ) return undefined;
      this.consumed = true;
      return { userId: this.row.userId, parentSessionHash: this.row.parentSessionHash };
    } finally {
      this.redeeming = false;
    }
  }

  async parentValid(): Promise<boolean> {
    return this.parentIsValid;
  }
}

const config = {
  clientId: 'zta-web',
  redirectUri: 'https://zta.example.test/auth/callback',
};

test('issues a bound one-time code and redeems it once', async () => {
  const store = new MemoryHandoffStore();
  const service = new ZtaHandoffService(store, config);
  const issued = await service.issue('user-1', 'a'.repeat(64), {
    clientId: config.clientId!,
    redirectUri: config.redirectUri!,
    state: 'state-123',
    codeChallenge: challenge,
  });
  expect(issued.code).toHaveLength(43);
  expect(store.row.codeHash).not.toBe(issued.code);
  await expect(
    service.redeem({
      code: issued.code,
      clientId: config.clientId!,
      redirectUri: config.redirectUri!,
      state: issued.state,
      codeVerifier: verifier,
    }),
  ).resolves.toMatchObject({ userId: 'user-1' });
  await expect(
    service.redeem({
      code: issued.code,
      clientId: config.clientId!,
      redirectUri: config.redirectUri!,
      state: issued.state,
      codeVerifier: verifier,
    }),
  ).rejects.toMatchObject({ status: 400 });
});

test.each([
  ['wrong state', { state: 'other', codeVerifier: verifier }],
  ['wrong redirect', { redirectUri: 'https://evil.example/cb', codeVerifier: verifier }],
  ['wrong verifier', { state: 'state-123', codeVerifier: 'x'.repeat(43) }],
])('rejects %s without consuming the code', async (_name, change) => {
  const store = new MemoryHandoffStore();
  const service = new ZtaHandoffService(store, config);
  const issued = await service.issue('user-1', 'a'.repeat(64), {
    clientId: config.clientId!,
    redirectUri: config.redirectUri!,
    state: 'state-123',
    codeChallenge: challenge,
  });
  await expect(
    service.redeem({
      code: issued.code,
      clientId: config.clientId!,
      redirectUri: change.redirectUri || config.redirectUri!,
      state: change.state || issued.state,
      codeVerifier: change.codeVerifier,
    }),
  ).rejects.toMatchObject({ status: 400 });
  expect(store.consumed).toBe(false);
});

test('revoked parent session prevents redemption', async () => {
  const store = new MemoryHandoffStore();
  store.parentIsValid = false;
  const service = new ZtaHandoffService(store, config);
  const issued = await service.issue('user-1', 'a'.repeat(64), {
    clientId: config.clientId!,
    redirectUri: config.redirectUri!,
    state: 'state-123',
    codeChallenge: challenge,
  });
  await expect(
    service.redeem({
      code: issued.code,
      clientId: config.clientId!,
      redirectUri: config.redirectUri!,
      state: issued.state,
      codeVerifier: verifier,
    }),
  ).rejects.toMatchObject({ status: 400 });
});

test('concurrent redemption permits only one consumer', async () => {
  const store = new MemoryHandoffStore();
  const service = new ZtaHandoffService(store, config);
  const issued = await service.issue('user-1', 'a'.repeat(64), {
    clientId: config.clientId!,
    redirectUri: config.redirectUri!,
    state: 'state-123',
    codeChallenge: challenge,
  });
  const results = await Promise.allSettled([
    service.redeem({ code: issued.code, clientId: config.clientId!, redirectUri: config.redirectUri!, state: issued.state, codeVerifier: verifier }),
    service.redeem({ code: issued.code, clientId: config.clientId!, redirectUri: config.redirectUri!, state: issued.state, codeVerifier: verifier }),
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
});
