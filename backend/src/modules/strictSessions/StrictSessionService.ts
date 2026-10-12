import {
  randomBytes,
  randomInt,
  createHash,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import { compare } from 'bcryptjs';
import canonicalizeAccountEmail from '@shared/utils/canonicalizeAccountEmail';

export interface Identity {
  id: string;
  email: string;
  password: string;
  status: string;
  deleted_at: Date | null;
  twoFactorAuthentication: boolean;
}
export interface Challenge {
  hash: string;
  user_id: string;
  code_hash: string;
  salt: string;
  credential_hash: string;
  expires_at: Date;
  attempts: number;
  consumed_at: Date | null;
  created_at: Date;
}
export interface Session {
  hash: string;
  user_id: string;
  credential_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}
export interface LockedStore {
  user: Identity | undefined;
  now: Date;
  latestChallenge(): Promise<Challenge | undefined>;
  challenge(hash: string): Promise<Challenge | undefined>;
  saveChallenge(value: Challenge): Promise<void>;
  invalidateChallenges(): Promise<void>;
  session(hash: string): Promise<Session | undefined>;
  saveSession(value: Session): Promise<void>;
}
export interface StrictStore {
  admitPasswordAttempt(key: string): Promise<boolean>;
  findUsers(email: string): Promise<Identity[]>;
  owner(
    kind: 'challenge' | 'session',
    hash: string,
  ): Promise<string | undefined>;
  locked<T>(
    userId: string,
    work: (store: LockedStore) => Promise<T>,
  ): Promise<T>;
}
export class StrictAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const digest = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
const fingerprint = (user: Identity): string =>
  digest(JSON.stringify([user.id, user.email, user.password]));
const active = (user?: Identity): user is Identity =>
  !!user &&
  user.status === 'active' &&
  !user.deleted_at &&
  user.twoFactorAuthentication === true;
const invalid = () =>
  new StrictAuthError(401, 'Invalid or expired credentials');
const random = () =>
  randomBytes(32)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
const codeHash = (code: string, salt: string): string =>
  scryptSync(code, salt, 32).toString('hex');

// Opaque credentials are exclusive to this service: no legacy JWT verification,
// no caller-selected identity, and no use of users.pin or users.pin_created_at.
export class StrictSessionService {
  constructor(
    private store: StrictStore,
    private mail: (email: string, code: string) => Promise<void>,
  ) {}

  async start(
    email: string,
    password: string,
  ): Promise<{ challenge: string; expiresInSeconds: number }> {
    const normalizedEmail = canonicalizeAccountEmail(email);
    if (!(await this.store.admitPasswordAttempt(digest(normalizedEmail)))) {
      throw new StrictAuthError(
        429,
        'Please wait before trying strict login again',
      );
    }
    const users = await this.store.findUsers(normalizedEmail);
    if (users.length !== 1) throw invalid();
    const candidate = users[0];
    if (!active(candidate) || !(await compare(password, candidate.password)))
      throw invalid();
    const credential = random();
    const code = String(randomInt(0, 100000000)).padStart(8, '0');
    const salt = randomBytes(16).toString('hex');
    const hash = digest(credential);
    await this.store.locked(candidate.id, async tx => {
      const user = tx.user;
      // Recheck after acquiring the shared row lock, including password changes.
      if (!active(user) || fingerprint(user) !== fingerprint(candidate))
        throw invalid();
      const last = await tx.latestChallenge();
      // Shared cooldown; failed delivery also counts. A new start requires password.
      if (last && tx.now.getTime() - last.created_at.getTime() < 60000) {
        throw new StrictAuthError(
          429,
          'Please wait before requesting another code',
        );
      }
      await tx.invalidateChallenges();
      await tx.saveChallenge({
        hash,
        user_id: user.id,
        salt,
        code_hash: codeHash(code, salt),
        credential_hash: fingerprint(user),
        expires_at: new Date(tx.now.getTime() + 300000),
        attempts: 0,
        consumed_at: null,
        created_at: tx.now,
      });
    });
    try {
      await this.mail(candidate.email, code);
    } catch {
      await this.store.locked(candidate.id, async tx => {
        const challenge = await tx.challenge(hash);
        if (challenge) {
          challenge.consumed_at = tx.now;
          await tx.saveChallenge(challenge);
        }
      });
      throw new StrictAuthError(503, 'Verification delivery unavailable');
    }
    return { challenge: credential, expiresInSeconds: 300 };
  }

  async verify(
    challengeCredential: string,
    code: string,
  ): Promise<{ token: string; expiresAt: string }> {
    if (
      !/^[A-Za-z0-9_-]{43}$/.test(challengeCredential) ||
      !/^\d{8}$/.test(code)
    )
      throw invalid();
    const hash = digest(challengeCredential);
    const owner = await this.store.owner('challenge', hash);
    if (!owner) throw invalid();
    const result = await this.store.locked(owner, async tx => {
      const challenge = await tx.challenge(hash);
      if (
        !challenge ||
        challenge.consumed_at ||
        challenge.attempts >= 5 ||
        challenge.expires_at <= tx.now
      )
        return null;
      if (
        !active(tx.user) ||
        challenge.credential_hash !== fingerprint(tx.user)
      ) {
        challenge.consumed_at = tx.now;
        await tx.saveChallenge(challenge);
        return null;
      }
      challenge.attempts += 1;
      const matches = timingSafeEqual(
        Buffer.from(challenge.code_hash, 'hex'),
        Buffer.from(codeHash(code, challenge.salt), 'hex'),
      );
      if (matches || challenge.attempts >= 5) challenge.consumed_at = tx.now;
      await tx.saveChallenge(challenge);
      // Return failure, rather than throw, so failed attempts commit.
      if (!matches) return null;
      const token = 'dgs1_' + random();
      const expiresAt = new Date(tx.now.getTime() + 3600000);
      await tx.saveSession({
        hash: digest(token),
        user_id: tx.user.id,
        credential_hash: fingerprint(tx.user),
        expires_at: expiresAt,
        revoked_at: null,
      });
      return { token, expiresAt: expiresAt.toISOString() };
    });
    // Only expose a credential after consumption AND session creation commit.
    if (!result) throw invalid();
    return result;
  }

  async validate(
    token: string,
  ): Promise<{ userId: string; expiresAt: string }> {
    return this.access(token, false);
  }

  async logout(token: string): Promise<void> {
    await this.access(token, true);
  }

  private async access(
    token: string,
    revoke: boolean,
  ): Promise<{ userId: string; expiresAt: string }> {
    if (!/^dgs1_[A-Za-z0-9_-]{43}$/.test(token)) throw invalid();
    const hash = digest(token);
    const owner = await this.store.owner('session', hash);
    if (!owner) throw invalid();
    const result = await this.store.locked(owner, async tx => {
      const session = await tx.session(hash);
      if (!session || session.revoked_at || session.expires_at <= tx.now)
        return null;
      if (
        !active(tx.user) ||
        session.credential_hash !== fingerprint(tx.user)
      ) {
        session.revoked_at = tx.now;
        await tx.saveSession(session);
        return null;
      }
      if (revoke) {
        session.revoked_at = tx.now;
        await tx.saveSession(session);
      }
      return {
        userId: tx.user.id,
        expiresAt: session.expires_at.toISOString(),
      };
    });
    if (!result) throw invalid();
    return result;
  }
}
