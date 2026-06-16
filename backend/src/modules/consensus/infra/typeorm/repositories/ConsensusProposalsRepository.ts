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
