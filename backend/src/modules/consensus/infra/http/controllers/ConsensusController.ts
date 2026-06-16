import consensusConfig from '@config/consensus';
import AppError from '@shared/errors/AppError';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { EnumConsensusVote } from '../../typeorm/entities/ConsensusVote';
import BroadcastConsensusVoteService from '@modules/consensus/services/BroadcastConsensusVoteService';
import CreateConsensusProposalService from '@modules/consensus/services/CreateConsensusProposalService';
import FinalizeConsensusProposalService from '@modules/consensus/services/FinalizeConsensusProposalService';
import SignNodeMessageService from '@modules/consensus/services/SignNodeMessageService';
import SubmitConsensusVoteService from '@modules/consensus/services/SubmitConsensusVoteService';
import ValidateConsensusProposalService from '@modules/consensus/services/ValidateConsensusProposalService';
import VerifyNodeSignatureService from '@modules/consensus/services/VerifyNodeSignatureService';

class ConsensusController {
  public async createProposal(
    request: Request,
    response: Response,
  ): Promise<Response> {
    try {
      if (!consensusConfig.enabled) {
        throw new AppError('Consensus is disabled.', 404);
      }

      const verifier = container.resolve(VerifyNodeSignatureService);
      const requestNodeName = verifier.execute({
        nodeName: request.headers['x-bft-node-name'],
        timestamp: request.headers['x-bft-timestamp'],
        signature: request.headers['x-bft-signature'],
        path: '/consensus/proposals',
        body: request.body,
      });

      const { proposalId, transactionSyncId, payload, payloadHash } =
        request.body;

      if (
        !proposalId ||
        !transactionSyncId ||
        !payload ||
        !payloadHash ||
        payload.proposalId !== proposalId ||
        payload.transactionSyncId !== transactionSyncId
      ) {
        throw new AppError('Invalid consensus proposal payload.', 400);
      }

      const createProposal = container.resolve(CreateConsensusProposalService);
      await createProposal.execute({
        proposalId,
        transactionSyncId,
        payloadHash,
        payload,
        originatingNode: payload.originatingNode || requestNodeName,
      });

      const validateProposal = container.resolve(
        ValidateConsensusProposalService,
      );
      const validation = await validateProposal.execute({
        payload,
        payloadHash,
      });

      const vote = validation.approved
        ? EnumConsensusVote.Approve
        : EnumConsensusVote.Reject;

      const signer = container.resolve(SignNodeMessageService);
      const voteResponse = {
        proposalId,
        transactionSyncId,
        nodeName: consensusConfig.localNodeName,
        vote,
        reason: validation.reason || null,
        payloadHash,
      };

      const submitVote = container.resolve(SubmitConsensusVoteService);
      await submitVote.execute({
        proposalId,
        transactionSyncId,
        nodeName: consensusConfig.localNodeName,
        vote,
        reason: validation.reason,
        payloadHash,
        signature: signer.execute({
          path: '/consensus/proposals:response',
          body: voteResponse,
        }),
      });

      const broadcastVote = container.resolve(BroadcastConsensusVoteService);
      await broadcastVote.execute(voteResponse);

      const finalizeProposal = container.resolve(
        FinalizeConsensusProposalService,
      );
      await finalizeProposal.execute({
        proposalId,
        finalizeTransaction: true,
      });

      response.set(signer.buildHeaders('/consensus/proposals:response', voteResponse));
      return response.json(voteResponse);
    } catch (error: any) {
      return response
        .status(error.statusCode || 400)
        .json({ error: error.message });
    }
  }

  public async createVote(
    request: Request,
    response: Response,
  ): Promise<Response> {
    try {
      if (!consensusConfig.enabled) {
        throw new AppError('Consensus is disabled.', 404);
      }

      const verifier = container.resolve(VerifyNodeSignatureService);
      const requestNodeName = verifier.execute({
        nodeName: request.headers['x-bft-node-name'],
        timestamp: request.headers['x-bft-timestamp'],
        signature: request.headers['x-bft-signature'],
        path: '/consensus/votes',
        body: request.body,
      });

      const {
        proposalId,
        transactionSyncId,
        nodeName,
        vote,
        reason,
        payloadHash,
      } = request.body;

      if (requestNodeName !== nodeName) {
        throw new AppError('Consensus vote node mismatch.', 403);
      }

      const submitVote = container.resolve(SubmitConsensusVoteService);
      await submitVote.execute({
        proposalId,
        transactionSyncId,
        nodeName,
        vote,
        reason,
        payloadHash,
      });

      const finalizeProposal = container.resolve(
        FinalizeConsensusProposalService,
      );
      await finalizeProposal.execute({
        proposalId,
        finalizeTransaction: true,
      });

      const body = { ok: true };
      const signer = container.resolve(SignNodeMessageService);
      response.set(signer.buildHeaders('/consensus/votes:response', body));
      return response.json(body);
    } catch (error: any) {
      return response
        .status(error.statusCode || 400)
        .json({ error: error.message });
    }
  }
}

export default ConsensusController;
