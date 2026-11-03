/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { getRepository, Repository } from 'typeorm';

import IConsensusVotesRepository from '@modules/consensus/repositories/IConsensusVotesRepository';
import ConsensusVote from '../entities/ConsensusVote';

class ConsensusVotesRepository implements IConsensusVotesRepository {
  private ormRepository: Repository<ConsensusVote>;

  constructor() {
    this.ormRepository = getRepository(ConsensusVote);
  }

  public async findByProposalAndNode(
    proposalId: string,
    nodeName: string,
  ): Promise<ConsensusVote | undefined> {
    return this.ormRepository.findOne({
      where: { proposal_id: proposalId, node_name: nodeName },
    });
  }

  public async findByProposalId(proposalId: string): Promise<ConsensusVote[]> {
    return this.ormRepository.find({ where: { proposal_id: proposalId } });
  }

  public async create(data: Partial<ConsensusVote>): Promise<ConsensusVote> {
    const vote = this.ormRepository.create(data);
    await this.ormRepository.save(vote);
    return vote;
  }

  public async save(vote: ConsensusVote): Promise<ConsensusVote> {
    return this.ormRepository.save(vote);
  }
}

export default ConsensusVotesRepository;
