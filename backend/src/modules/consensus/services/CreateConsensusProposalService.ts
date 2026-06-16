import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import ConsensusProposal, {
  EnumConsensusProposalStatus,
} from '../infra/typeorm/entities/ConsensusProposal';
import IConsensusProposalsRepository from '../repositories/IConsensusProposalsRepository';

interface IRequest {
  proposalId: string;
  transactionSyncId: string;
  payloadHash: string;
  payload: any;
  originatingNode: string;
}

@injectable()
class CreateConsensusProposalService {
  constructor(
    @inject('ConsensusProposalsRepository')
    private proposalsRepository: IConsensusProposalsRepository,
  ) {}

  public async execute({
    proposalId,
    transactionSyncId,
    payloadHash,
    payload,
    originatingNode,
  }: IRequest): Promise<ConsensusProposal> {
    const existingProposal = await this.proposalsRepository.findByProposalId(
      proposalId,
    );

    if (existingProposal) {
      if (
        existingProposal.payload_hash !== payloadHash ||
        existingProposal.transaction_sync_id !== transactionSyncId
      ) {
        throw new AppError('Conflicting consensus proposal.', 409);
      }

      return existingProposal;
    }

    return this.proposalsRepository.create({
      proposal_id: proposalId,
      transaction_sync_id: transactionSyncId,
      payload_hash: payloadHash,
      payload,
      originating_node: originatingNode,
      status: EnumConsensusProposalStatus.Pending,
      approval_count: 0,
      rejection_count: 0,
    });
  }
}

export default CreateConsensusProposalService;
