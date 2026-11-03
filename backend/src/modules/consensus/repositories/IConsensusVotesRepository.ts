/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ConsensusVote from '../infra/typeorm/entities/ConsensusVote';

export default interface IConsensusVotesRepository {
  findByProposalAndNode(
    proposalId: string,
    nodeName: string,
  ): Promise<ConsensusVote | undefined>;
  findByProposalId(proposalId: string): Promise<ConsensusVote[]>;
  create(data: Partial<ConsensusVote>): Promise<ConsensusVote>;
  save(vote: ConsensusVote): Promise<ConsensusVote>;
}
