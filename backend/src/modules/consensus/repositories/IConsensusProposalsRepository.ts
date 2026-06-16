import ConsensusProposal from '../infra/typeorm/entities/ConsensusProposal';

export default interface IConsensusProposalsRepository {
  findByProposalId(proposalId: string): Promise<ConsensusProposal | undefined>;
  findByTransactionSyncId(
    transactionSyncId: string,
  ): Promise<ConsensusProposal | undefined>;
  create(data: Partial<ConsensusProposal>): Promise<ConsensusProposal>;
  save(proposal: ConsensusProposal): Promise<ConsensusProposal>;
}
