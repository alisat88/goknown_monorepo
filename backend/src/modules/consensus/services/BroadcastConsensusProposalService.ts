import { api } from '@config/api';
import consensusConfig, { getPeerConsensusNodes } from '@config/consensus';
import { EnumConsensusVote } from '../infra/typeorm/entities/ConsensusVote';
import { container, injectable } from 'tsyringe';
import SignNodeMessageService from './SignNodeMessageService';
import VerifyNodeSignatureService from './VerifyNodeSignatureService';

interface IRequest {
  proposalId: string;
  transactionSyncId: string;
  payloadHash: string;
  payload: any;
}

interface IConsensusVoteResponse {
  proposalId: string;
  transactionSyncId: string;
  nodeName: string;
  vote: EnumConsensusVote;
  reason?: string | null;
  payloadHash: string;
}

@injectable()
class BroadcastConsensusProposalService {
  public async execute({
    proposalId,
    transactionSyncId,
    payloadHash,
    payload,
  }: IRequest): Promise<IConsensusVoteResponse[]> {
    const signer = container.resolve(SignNodeMessageService);
    const verifier = container.resolve(VerifyNodeSignatureService);
    const path = '/consensus/proposals';
    const responsePath = '/consensus/proposals:response';
    const body = {
      proposalId,
      transactionSyncId,
      payload,
      payloadHash,
    };

    const votes = await Promise.all(
      getPeerConsensusNodes().map(async node => {
        try {
          const response = await api.post(`${node.url}${path}`, body, {
            headers: signer.buildHeaders(path, body),
            timeout: consensusConfig.requestTimeoutMs,
          });

          verifier.execute({
            nodeName: response.headers['x-bft-node-name'],
            timestamp: response.headers['x-bft-timestamp'],
            signature: response.headers['x-bft-signature'],
            path: responsePath,
            body: response.data,
          });

          if (response.data?.nodeName !== node.name) {
            return null;
          }

          return response.data as IConsensusVoteResponse;
        } catch (error: any) {
          console.warn(
            `[consensus] proposal ${proposalId} did not receive a valid vote from ${node.name}: ${error?.message || error}`,
          );
          return null;
        }
      }),
    );

    return votes.filter(
      (vote): vote is IConsensusVoteResponse => vote !== null,
    );
  }
}

export default BroadcastConsensusProposalService;
