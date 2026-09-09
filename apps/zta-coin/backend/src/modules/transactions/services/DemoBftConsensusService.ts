type ConsensusDecision = 'approved' | 'rejected';

interface IConsensusProposal {
  proposalId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  hasSufficientBalance: boolean;
}

interface IConsensusVote {
  node: string;
  decision: ConsensusDecision;
  reason: string;
}

interface IConsensusResult {
  mode: 'simulation';
  proposalId: string;
  status: ConsensusDecision;
  quorum: number;
  approvalCount: number;
  rejectionCount: number;
  votes: IConsensusVote[];
}

const validators = [
  'zta-validator-a',
  'zta-validator-b',
  'zta-validator-c',
];

function validateProposal(proposal: IConsensusProposal): string[] {
  const errors: string[] = [];

  const fromUser =
    typeof proposal.fromUser === 'string' ? proposal.fromUser.trim() : '';
  const toUser =
    typeof proposal.toUser === 'string' ? proposal.toUser.trim() : '';

  if (!fromUser || !toUser) {
    errors.push('Both transfer accounts are required');
  }

  if (fromUser && toUser && fromUser === toUser) {
    errors.push('Sender and recipient must be different');
  }

  if (!Number.isFinite(proposal.amount) || proposal.amount <= 0) {
    errors.push('Transfer amount must be greater than zero');
  }

  if (!proposal.hasSufficientBalance) {
    errors.push('Insufficient balance');
  }

  return errors;
}

class DemoBftConsensusService {
  public execute(proposal: IConsensusProposal): IConsensusResult {
    const votes = validators.map(node => {
      const errors = validateProposal(proposal);

      return {
        node,
        decision: errors.length === 0 ? 'approved' : 'rejected',
        reason: errors.length === 0 ? 'Proposal validated' : errors.join('; '),
      } as IConsensusVote;
    });

    const approvalCount = votes.filter(
      vote => vote.decision === 'approved',
    ).length;
    const rejectionCount = votes.length - approvalCount;
    const quorum = 2;

    return {
      mode: 'simulation',
      proposalId: proposal.proposalId,
      status: approvalCount >= quorum ? 'approved' : 'rejected',
      quorum,
      approvalCount,
      rejectionCount,
      votes,
    };
  }
}

export default DemoBftConsensusService;
