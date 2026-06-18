import { Router } from "express";
import consensusConfig, { validateConsensusConfig } from "@config/consensus";
import BroadcastConsensusProposalService from "@modules/consensus/services/BroadcastConsensusProposalService";
import BroadcastConsensusVoteService from "@modules/consensus/services/BroadcastConsensusVoteService";
import BuildConsensusPayloadHashService from "@modules/consensus/services/BuildConsensusPayloadHashService";
import CreateConsensusProposalService from "@modules/consensus/services/CreateConsensusProposalService";
import FinalizeConsensusProposalService from "@modules/consensus/services/FinalizeConsensusProposalService";
import SignNodeMessageService from "@modules/consensus/services/SignNodeMessageService";
import SubmitConsensusVoteService from "@modules/consensus/services/SubmitConsensusVoteService";
import ValidateConsensusProposalService from "@modules/consensus/services/ValidateConsensusProposalService";
import {
  EnumConsensusProposalStatus,
} from "@modules/consensus/infra/typeorm/entities/ConsensusProposal";
import { EnumConsensusVote } from "@modules/consensus/infra/typeorm/entities/ConsensusVote";
import { container } from "tsyringe";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// 🔥 In-memory accounts
const balances: Record<string, number> = {
  Alisa: 1000,
  Mike: 1000,
  Connie: 1000,
  Chuck: 1000,
  "ERAU team": 1000,
  Leo: 1000,
};

// 📊 simple transaction tracking
const transactions: Record<string, number[]> = {
  Alisa: [],
  Mike: [],
  Connie: [],
  Chuck: [],
  "ERAU team": [],
  Leo: [],
};

// =======================
// 🪙 MINT
// =======================
router.post("/mint", (req, res) => {
  const { user_id, amount } = req.body;

  if (!balances[user_id]) {
    return res.status(400).json({ error: "Invalid user" });
  }

  balances[user_id] += amount;
  transactions[user_id].push(amount);

  return res.status(201).json({
    message: "Mint successful",
    balance: balances[user_id],
  });
});

// =======================
// 💸 TRANSFER
// =======================
router.post("/transfer", async (req, res) => {
  const { from_user, to_user, amount } = req.body;

  if (!balances[from_user] || !balances[to_user]) {
    return res.status(400).json({ error: "Invalid user" });
  }

  if (balances[from_user] < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  if (consensusConfig.enabled) {
    try {
      validateConsensusConfig();

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const transactionSyncId = uuidv4();
      const proposalId = `payments.transfer:${transactionSyncId}`;
      const createdAt = Date.now();
      const payload = {
        action: "payments.transfer",
        proposalId,
        transactionSyncId,
        from_user,
        to_user,
        amount: numericAmount,
        originatingNode: consensusConfig.localNodeName,
        createdAt,
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
      console.log(`[payments-consensus] proposal created ${proposalId}`);

      const validateProposal = container.resolve(
        ValidateConsensusProposalService,
      );
      const localValidation = await validateProposal.execute({
        payload,
        payloadHash,
      });
      const localVote = localValidation.approved
        ? EnumConsensusVote.Approve
        : EnumConsensusVote.Reject;
      const localVoteBody = {
        proposalId,
        transactionSyncId,
        nodeName: consensusConfig.localNodeName,
        vote: localVote,
        reason: localValidation.reason || null,
        payloadHash,
      };

      const signer = container.resolve(SignNodeMessageService);
      const submitVote = container.resolve(SubmitConsensusVoteService);
      await submitVote.execute({
        ...localVoteBody,
        signature: signer.execute({
          path: "/consensus/proposals:response",
          body: localVoteBody,
        }),
      });
      console.log(
        `[payments-consensus] local vote recorded ${proposalId} ${localVote}`,
      );

      const broadcastProposal = container.resolve(
        BroadcastConsensusProposalService,
      );
      const peerVotes = await broadcastProposal.execute({
        proposalId,
        transactionSyncId,
        payloadHash,
        payload,
      });
      console.log(
        `[payments-consensus] peer votes received ${proposalId} count=${peerVotes.length}`,
      );

      await Promise.all(
        peerVotes.map(vote =>
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

      const broadcastVote = container.resolve(BroadcastConsensusVoteService);
      await broadcastVote.execute(localVoteBody);

      const finalizeProposal = container.resolve(
        FinalizeConsensusProposalService,
      );
      const proposal = await finalizeProposal.execute({
        proposalId,
        finalizeTransaction: false,
      });
      console.log(
        `[payments-consensus] final status ${proposalId} ${proposal?.status || "unknown"} approvals=${proposal?.approval_count || 0} rejections=${proposal?.rejection_count || 0}`,
      );

      if (proposal?.status !== EnumConsensusProposalStatus.Approved) {
        return res.status(409).json({
          error:
            proposal?.status === EnumConsensusProposalStatus.Rejected
              ? "Transfer rejected by consensus"
              : "Transfer consensus quorum not reached",
          consensus: proposal
            ? {
                proposalId: proposal.proposal_id,
                status: proposal.status,
                approvalCount: proposal.approval_count,
                rejectionCount: proposal.rejection_count,
                failureReason: proposal.failure_reason,
              }
            : null,
        });
      }

      balances[from_user] -= numericAmount;
      balances[to_user] += numericAmount;

      transactions[from_user].push(-numericAmount);
      transactions[to_user].push(numericAmount);

      return res.json({
        message: "Transfer successful",
        from_balance: balances[from_user],
        to_balance: balances[to_user],
        consensus: {
          proposalId: proposal.proposal_id,
          status: proposal.status,
          approvalCount: proposal.approval_count,
          rejectionCount: proposal.rejection_count,
        },
      });
    } catch (error: any) {
      console.warn(
        `[payments-consensus] transfer failed before balance mutation: ${error?.message || error}`,
      );
      return res.status(error.statusCode || 500).json({
        error: error.message || "Transfer consensus failed",
      });
    }
  }

  balances[from_user] -= amount;
  balances[to_user] += amount;

  transactions[from_user].push(-amount);
  transactions[to_user].push(amount);

  return res.json({
    message: "Transfer successful",
    from_balance: balances[from_user],
    to_balance: balances[to_user],
  });
});

// =======================
// 📊 VELOCITY
// =======================
router.get("/velocity/:user", (req, res) => {
  const { user } = req.params;

  if (!transactions[user]) {
    return res.status(400).json({ error: "Invalid user" });
  }

  const lastTransactions = transactions[user];

  return res.json({
    last1minVolume: lastTransactions.slice(-1).reduce((a, b) => a + b, 0),
    last5minVolume: lastTransactions.slice(-5).reduce((a, b) => a + b, 0),
    last1hrVolume: lastTransactions.reduce((a, b) => a + b, 0),
    txCountLast5min: lastTransactions.slice(-5).length,
    isSuspicious: lastTransactions.slice(-5).length > 3,
  });
});

export default router;
