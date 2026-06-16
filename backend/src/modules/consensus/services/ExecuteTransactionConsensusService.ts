import consensusConfig, { validateConsensusConfig } from '@config/consensus';
import { EnumCategory, EnumTransactionType } from '@modules/transactions/infra/typeorm/entities/Transaction';
import { inject, injectable, container } from 'tsyringe';
import IConsensusPayloadDTO from '../dtos/IConsensusPayloadDTO';
import {
  EnumConsensusProposalStatus,
} from '../infra/typeorm/entities/ConsensusProposal';
import { EnumConsensusVote } from '../infra/typeorm/entities/ConsensusVote';
import IConsensusProposalsRepository from '../repositories/IConsensusProposalsRepository';
import BroadcastConsensusProposalService from './BroadcastConsensusProposalService';
import BroadcastConsensusVoteService from './BroadcastConsensusVoteService';
import BuildConsensusPayloadHashService from './BuildConsensusPayloadHashService';
import CreateConsensusProposalService from './CreateConsensusProposalService';
import FinalizeConsensusProposalService from './FinalizeConsensusProposalService';
import SignNodeMessageService from './SignNodeMessageService';
import SubmitConsensusVoteService from './SubmitConsensusVoteService';
import ValidateConsensusProposalService from './ValidateConsensusProposalService';

interface IRequest {
  transactionSyncId: string;
  amount: number;
  fromUserId: string;
  toUserId: string;
  organizationId?: string | null;
  timestamp: number;
}

@injectable()
class ExecuteTransactionConsensusService {
  constructor(
    @inject('ConsensusProposalsRepository')
    private proposalsRepository: IConsensusProposalsRepository,
  ) {}

  public async execute({
    transactionSyncId,
    amount,
    fromUserId,
    toUserId,
    organizationId,
    timestamp,
  }: IRequest) {
    validateConsensusConfig();

    const proposalId = `transaction:${transactionSyncId}`;
    const payload: IConsensusPayloadDTO = {
      proposalId,
      transactionSyncId,
      category: EnumCategory.Transaction,
      transactionType: EnumTransactionType.Sent,
      amount: Number(amount),
      fromUserId,
      toUserId,
      organizationId: organizationId || null,
      originatingNode: consensusConfig.localNodeName,
      createdAt: timestamp,
    };

    const buildHash = container.resolve(BuildConsensusPayloadHashService);
    const payloadHash = buildHash.execute(payload);

    const createProposal = container.resolve(CreateConsensusProposalService);
    await createProposal.execute({
      proposalId,
      transactionSyncId,
      payloadHash,
      payload,
      originatingNode: consensusConfig.localNodeName,
    });

    const validateProposal = container.resolve(ValidateConsensusProposalService);
    const localValidation = await validateProposal.execute({
      payload,
      payloadHash,
    });
    const localVote = localValidation.approved
      ? EnumConsensusVote.Approve
      : EnumConsensusVote.Reject;
    const signer = container.resolve(SignNodeMessageService);
    const localVoteBody = {
      proposalId,
      transactionSyncId,
      nodeName: consensusConfig.localNodeName,
      vote: localVote,
      reason: localValidation.reason || null,
      payloadHash,
    };

    const submitVote = container.resolve(SubmitConsensusVoteService);
    await submitVote.execute({
      proposalId,
      transactionSyncId,
      nodeName: consensusConfig.localNodeName,
      vote: localVote,
      reason: localValidation.reason,
      payloadHash,
      signature: signer.execute({
        path: '/consensus/proposals:response',
        body: localVoteBody,
      }),
    });

    const broadcastVote = container.resolve(BroadcastConsensusVoteService);
    await broadcastVote.execute(localVoteBody);

    const broadcastProposal = container.resolve(BroadcastConsensusProposalService);
    const peerVotes = await broadcastProposal.execute({
      proposalId,
      transactionSyncId,
      payloadHash,
      payload,
    });

    await Promise.all(
      peerVotes
        .filter(
          vote =>
            vote.vote === EnumConsensusVote.Approve ||
            vote.vote === EnumConsensusVote.Reject,
        )
        .map(vote =>
          submitVote.execute({
            proposalId: vote.proposalId,
            transactionSyncId: vote.transactionSyncId,
            nodeName: vote.nodeName,
            vote: vote.vote,
            reason: vote.reason,
            payloadHash: vote.payloadHash,
          }),
        ),
    );

    const finalizeProposal = container.resolve(FinalizeConsensusProposalService);
    let proposal = await finalizeProposal.execute({
      proposalId,
      finalizeTransaction: true,
    });

    if (
      proposal &&
      proposal.status === EnumConsensusProposalStatus.Pending &&
      proposal.approval_count < consensusConfig.quorumSize &&
      proposal.rejection_count < consensusConfig.quorumSize
    ) {
      proposal.failure_reason = 'Consensus quorum not reached before timeout.';
      proposal = await this.proposalsRepository.save(proposal);
    }

    return proposal;
  }
}

export default ExecuteTransactionConsensusService;
