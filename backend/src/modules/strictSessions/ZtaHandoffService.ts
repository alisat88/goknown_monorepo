import { createHash, randomBytes, timingSafeEqual } from 'crypto';

import { digest, StrictAuthError } from './StrictSessionService';

export interface HandoffRequest {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}

export interface HandoffRedemption {
  code: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeVerifier: string;
}

export interface HandoffStore {
  issue(input: {
    userId: string;
    parentSessionHash: string;
    clientId: string;
    redirectUri: string;
    stateHash: string;
    codeChallenge: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<void>;
  redeem(input: {
    codeHash: string;
    clientId: string;
    redirectUri: string;
    stateHash: string;
    codeVerifier: string;
    now: Date;
  }): Promise<{ userId: string; parentSessionHash: string } | undefined>;
  parentValid(parentSessionHash: string, now: Date): Promise<boolean>;
}

const b64url = (value: string): boolean => /^[A-Za-z0-9_-]+$/.test(value);
const equalDigest = (left: string, right: string): boolean => {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};
const invalid = (): never => {
  throw new StrictAuthError(400, 'Invalid handoff request');
};

export class ZtaHandoffService {
  constructor(
    private store: HandoffStore,
    private config: { clientId?: string; redirectUri?: string },
  ) {}

  async issue(userId: string, parentSessionHash: string, input: HandoffRequest) {
    if (
      !this.config.clientId ||
      !this.config.redirectUri ||
      input.clientId !== this.config.clientId ||
      input.redirectUri !== this.config.redirectUri ||
      !userId ||
      !/^[a-f0-9]{64}$/.test(parentSessionHash) ||
      !input.state ||
      input.state.length > 256 ||
      !b64url(input.state) ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(input.codeChallenge)
    ) {
      invalid();
    }
    const code = randomBytes(32).toString('base64url');
    await this.store.issue({
      userId,
      parentSessionHash,
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      stateHash: digest(input.state),
      codeChallenge: input.codeChallenge,
      codeHash: digest(code),
      expiresAt: new Date(Date.now() + 120000),
    });
    return { code, state: input.state, expiresInSeconds: 120 };
  }

  async redeem(input: HandoffRedemption): Promise<{ userId: string; parentSessionHash: string }> {
    if (
      !this.config.clientId ||
      !this.config.redirectUri ||
      input.clientId !== this.config.clientId ||
      input.redirectUri !== this.config.redirectUri ||
      !/^[A-Za-z0-9_-]{43}$/.test(input.code) ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(input.codeVerifier) ||
      !input.state ||
      input.state.length > 256 ||
      !b64url(input.state)
    ) {
      throw new StrictAuthError(400, 'Invalid or expired handoff');
    }
    const result = await this.store.redeem({
      codeHash: digest(input.code),
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      stateHash: digest(input.state),
      codeVerifier: input.codeVerifier,
      now: new Date(),
    });
    if (!result) throw new StrictAuthError(400, 'Invalid or expired handoff');
    return result;
  }

  async validateParent(parentSessionHash: string): Promise<boolean> {
    if (!/^[a-f0-9]{64}$/.test(parentSessionHash)) return false;
    return this.store.parentValid(parentSessionHash, new Date());
  }

  static pkceChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  static safeEqualDigest(left: string, right: string): boolean {
    return equalDigest(left, right);
  }
}
