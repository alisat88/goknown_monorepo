import consensusConfig, { isKnownConsensusNode } from '@config/consensus';
import ApprovedTransactionVoteService from '@modules/transactions/services/ApprovedTransactionVoteService';
import UnApprovedTransactionVoteService from '@modules/transactions/services/UnApprovedTransactionVoteService';
import { inject, injectable, container } from 'tsyringe';
import {
  EnumConsensusProposalStatus,
} from '../infra/typeorm/entities/ConsensusProposal';
import { EnumConsensusVote } from '../infra/typeorm/entities/ConsensusVote';
import IConsensusProposalsRepository from '../repositories/IConsensusProposalsRepository';
import IConsensusVotesRepository from '../repositories/IConsensusVotesRepository';

interface IRequest {
  proposalId: string;
  finalizeTransaction?: boolean;
}

@injectable()
class FinalizeConsensusProposalService {
  constructor(
    @inject('ConsensusProposalsRepository')
    private proposalsRepository: IConsensusProposalsRepository,

    @inject('ConsensusVotesRepository')
    private votesRepository: IConsensusVotesRepository,
  ) {}

  public async execute({ proposalId, finalizeTransaction = true }: IRequest) {
    const proposal = await this.proposalsRepository.findByProposalId(proposalId);

    if (!proposal) {
      return undefined;
    }

    const votes = await this.votesRepository.findByProposalId(proposalId);
    const countedVotes = votes.filter(
      vote =>
        vote.payload_hash === proposal.payload_hash &&
        isKnownConsensusNode(vote.node_name),
    );

    const approvalCount = countedVotes.filter(
      vote => vote.vote === EnumConsensusVote.Approve,
    ).length;
    const rejectionCount = countedVotes.filter(
      vote => vote.vote === EnumConsensusVote.Reject,
    ).length;

    proposal.approval_count = approvalCount;
    proposal.rejection_count = rejectionCount;

    if (
      proposal.status !== EnumConsensusProposalStatus.Approved &&
      proposal.status !== EnumConsensusProposalStatus.Rejected &&
      proposal.status !== EnumConsensusProposalStatus.Failed
    ) {
      if (approvalCount >= consensusConfig.quorumSize) {
        if (finalizeTransaction) {
          try {
            const approveTransaction = container.resolve(
              ApprovedTransactionVoteService,
            );
            await approveTransaction.execute(proposal.transaction_sync_id);
          } catch (error: any) {
            proposal.failure_reason = `Consensus approved but local transaction finalization failed: ${error.message}`;
            await this.proposalsRepository.save(proposal);
            return proposal;
          }
        }

        proposal.status = EnumConsensusProposalStatus.Approved;
        proposal.finalized_at = new Date();
      } else if (rejectionCount >= consensusConfig.quorumSize) {
        proposal.failure_reason = countedVotes
          .filter(vote => vote.vote === EnumConsensusVote.Reject)
          .map(vote => vote.reason)
          .filter(Boolean)
          .join(', ');

        if (finalizeTransaction) {
          try {
            const unapproveTransaction = container.resolve(
              UnApprovedTransactionVoteService,
            );
            await unapproveTransaction.execute(proposal.transaction_sync_id, [
              proposal.failure_reason ||
                'Consensus quorum rejected transaction.',
            ]);
          } catch (error: any) {
            proposal.failure_reason = `Consensus rejected but local transaction finalization failed: ${error.message}`;
            await this.proposalsRepository.save(proposal);
            return proposal;
          }
        }

        proposal.status = EnumConsensusProposalStatus.Rejected;
        proposal.finalized_at = new Date();
      }
    }

    await this.proposalsRepository.save(proposal);
    return proposal;
  }
}

export default FinalizeConsensusProposalService;
