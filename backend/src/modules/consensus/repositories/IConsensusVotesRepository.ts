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
