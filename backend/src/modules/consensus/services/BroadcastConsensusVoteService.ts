/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { api } from '@config/api';
import consensusConfig, { getPeerConsensusNodes } from '@config/consensus';
import { EnumConsensusVote } from '../infra/typeorm/entities/ConsensusVote';
import { container, injectable } from 'tsyringe';
import SignNodeMessageService from './SignNodeMessageService';

interface IRequest {
  proposalId: string;
  transactionSyncId: string;
  nodeName: string;
  vote: EnumConsensusVote;
  reason?: string | null;
  payloadHash: string;
}

@injectable()
class BroadcastConsensusVoteService {
  public async execute(vote: IRequest): Promise<void> {
    const signer = container.resolve(SignNodeMessageService);
    const path = '/consensus/votes';

    await Promise.all(
      getPeerConsensusNodes().map(async node => {
        try {
          await api.post(`${node.url}${path}`, vote, {
            headers: signer.buildHeaders(path, vote),
            timeout: consensusConfig.requestTimeoutMs,
          });
        } catch (error: any) {
          console.warn(
            `[consensus] vote for proposal ${vote.proposalId} was not accepted by ${node.name}: ${error?.message || error}`,
          );
        }
      }),
    );
  }
}

export default BroadcastConsensusVoteService;
