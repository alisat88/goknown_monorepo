import AppError from '@shared/errors/AppError';
import { isKnownConsensusNode } from '@config/consensus';
import { inject, injectable } from 'tsyringe';
import ConsensusVote, {
  EnumConsensusVote,
} from '../infra/typeorm/entities/ConsensusVote';
import IConsensusVotesRepository from '../repositories/IConsensusVotesRepository';

interface IRequest {
  proposalId: string;
  transactionSyncId: string;
  nodeName: string;
  vote: EnumConsensusVote;
  reason?: string | null;
  payloadHash: string;
  signature?: string | null;
}

@injectable()
class SubmitConsensusVoteService {
  constructor(
    @inject('ConsensusVotesRepository')
    private votesRepository: IConsensusVotesRepository,
  ) {}

  public async execute({
    proposalId,
    transactionSyncId,
    nodeName,
    vote,
    reason,
    payloadHash,
    signature,
  }: IRequest): Promise<ConsensusVote> {
    if (!isKnownConsensusNode(nodeName)) {
      throw new AppError('Unknown consensus node.', 403);
    }

    const existingVote = await this.votesRepository.findByProposalAndNode(
      proposalId,
      nodeName,
    );

    if (existingVote) {
      if (
        existingVote.vote !== vote ||
        existingVote.payload_hash !== payloadHash ||
        existingVote.transaction_sync_id !== transactionSyncId
      ) {
        throw new AppError('Conflicting consensus vote.', 409);
      }

      return existingVote;
    }

    return this.votesRepository.create({
      proposal_id: proposalId,
      transaction_sync_id: transactionSyncId,
      node_name: nodeName,
      vote,
      reason,
      payload_hash: payloadHash,
      signature,
    });
  }
}

export default SubmitConsensusVoteService;
