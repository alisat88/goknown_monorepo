/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ConsensusProposal from '../infra/typeorm/entities/ConsensusProposal';

export default interface IConsensusProposalsRepository {
  findByProposalId(proposalId: string): Promise<ConsensusProposal | undefined>;
  findByTransactionSyncId(
    transactionSyncId: string,
  ): Promise<ConsensusProposal | undefined>;
  create(data: Partial<ConsensusProposal>): Promise<ConsensusProposal>;
  save(proposal: ConsensusProposal): Promise<ConsensusProposal>;
}
