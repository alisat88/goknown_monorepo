/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { getRepository, Repository } from 'typeorm';

import IConsensusProposalsRepository from '@modules/consensus/repositories/IConsensusProposalsRepository';
import ConsensusProposal from '../entities/ConsensusProposal';

class ConsensusProposalsRepository
  implements IConsensusProposalsRepository
{
  private ormRepository: Repository<ConsensusProposal>;

  constructor() {
    this.ormRepository = getRepository(ConsensusProposal);
  }

  public async findByProposalId(
    proposalId: string,
  ): Promise<ConsensusProposal | undefined> {
    return this.ormRepository.findOne({ where: { proposal_id: proposalId } });
  }

  public async findByTransactionSyncId(
    transactionSyncId: string,
  ): Promise<ConsensusProposal | undefined> {
    return this.ormRepository.findOne({
      where: { transaction_sync_id: transactionSyncId },
      order: { created_at: 'DESC' },
    });
  }

  public async create(
    data: Partial<ConsensusProposal>,
  ): Promise<ConsensusProposal> {
    const proposal = this.ormRepository.create(data);
    await this.ormRepository.save(proposal);
    return proposal;
  }

  public async save(
    proposal: ConsensusProposal,
  ): Promise<ConsensusProposal> {
    return this.ormRepository.save(proposal);
  }
}

export default ConsensusProposalsRepository;
