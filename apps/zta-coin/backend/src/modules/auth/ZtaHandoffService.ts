import axios from 'axios';
import { createHash, randomBytes } from 'crypto';

import { ZtaAuthSessionStore } from './ZtaAuthSessionStore';

export interface HandoffInput {
  code: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeVerifier: string;
  transactionCookie: string;
}

export class ZtaHandoffError extends Error {}

const digest = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export class ZtaHandoffService {
  constructor(
    private store: ZtaAuthSessionStore,
    private http = axios,
    private config: {
      dappRedeemUrl?: string;
      dappValidateUrl?: string;
      serviceToken?: string;
      clientId?: string;
      redirectUri?: string;
    } = {},
  ) {}

  async startTransaction(): Promise<{
    transactionCookie: string;
    state: string;
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
    expiresInSeconds: number;
  }> {
    if (!this.config.clientId || !this.config.redirectUri) {
      throw new ZtaHandoffError('Handoff unavailable');
    }
    const transactionCookie = `ztat_${randomBytes(32).toString('base64url')}`;
    const state = randomBytes(24).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    await this.store.createTransaction({
      hash: digest(transactionCookie),
      state_hash: digest(state),
      verifier_hash: digest(codeVerifier),
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      expires_at: new Date(Date.now() + 300000),
    });
    return {
      transactionCookie,
      state,
      codeVerifier,
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      expiresInSeconds: 300,
    };
  }

  async redeem(input: HandoffInput): Promise<{ expiresAt: string }> {
    if (
      !this.config.dappRedeemUrl ||
      !this.config.serviceToken ||
      input.clientId !== this.config.clientId ||
      input.redirectUri !== this.config.redirectUri ||
      !/^[A-Za-z0-9_-]{43}$/.test(input.code) ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(input.codeVerifier) ||
      !/^ztat_[A-Za-z0-9_-]{43}$/.test(input.transactionCookie) ||
      !input.state ||
      input.state.length > 256
    ) {
      throw new ZtaHandoffError('Invalid or expired handoff');
    }
    const transaction = await this.store.consumeTransaction({
      hash: digest(input.transactionCookie),
      stateHash: digest(input.state),
      verifierHash: digest(input.codeVerifier),
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      now: new Date(),
    });
    if (!transaction) throw new ZtaHandoffError('Invalid or expired handoff');
    let parent: { userId: string; parentSessionHash: string };
    try {
      const response = await this.http.post(
        this.config.dappRedeemUrl,
        {
          code: input.code,
          client_id: input.clientId,
          redirect_uri: input.redirectUri,
          state: input.state,
          code_verifier: input.codeVerifier,
        },
        {
          headers: { 'X-ZTA-Handoff-Token': this.config.serviceToken },
          timeout: 5000,
        },
      );
      if (
        !response.data ||
        typeof response.data.userId !== 'string' ||
        typeof response.data.parentSessionHash !== 'string'
      ) {
        throw new Error('Malformed handoff response');
      }
      parent = response.data;
    } catch {
      throw new ZtaHandoffError('Invalid or expired handoff');
    }
    const token = `zta1_${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + 3600000);
    await this.store.create({
      hash: digest(token),
      dapp_user_id: parent.userId,
      parent_session_hash: parent.parentSessionHash,
      expires_at: expiresAt,
      revoked_at: null,
    });
    return { token, expiresAt: expiresAt.toISOString() };
  }

  async validate(token: string): Promise<{ userId: string; expiresAt: string; parentSessionHash: string }> {
    if (!/^zta1_[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new ZtaHandoffError('Authentication required');
    }
    const record = await this.store.findActive(digest(token));
    if (!record) throw new ZtaHandoffError('Authentication required');
    if (!this.config.dappValidateUrl || !this.config.serviceToken) {
      throw new ZtaHandoffError('Authentication unavailable');
    }
    try {
      const response = await this.http.post(
        this.config.dappValidateUrl,
        { parent_session_hash: record.parent_session_hash },
        {
          headers: { 'X-ZTA-Handoff-Token': this.config.serviceToken },
          timeout: 5000,
        },
      );
      if (!response.data || response.data.valid !== true) {
        await this.store.revoke(digest(token));
        throw new ZtaHandoffError('Authentication required');
      }
    } catch (error) {
      if (error instanceof ZtaHandoffError) throw error;
      throw new ZtaHandoffError('Authentication unavailable');
    }
    return {
      userId: record.dapp_user_id,
      expiresAt: new Date(record.expires_at).toISOString(),
      parentSessionHash: record.parent_session_hash,
    };
  }

  async logout(token: string): Promise<void> {
    const identity = await this.validate(token);
    await this.store.revoke(digest(token));
    void identity;
  }
}
