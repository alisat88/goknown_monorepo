import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import ConsensusController from '../controllers/ConsensusController';

const consensusRouter = Router();
const consensusController = new ConsensusController();

consensusRouter.post(
  '/proposals',
  celebrate({
    [Segments.BODY]: {
      proposalId: Joi.string().required(),
      transactionSyncId: Joi.string().required(),
      payloadHash: Joi.string().required(),
      payload: Joi.object().required(),
    },
  }),
  consensusController.createProposal,
);

consensusRouter.post(
  '/votes',
  celebrate({
    [Segments.BODY]: {
      proposalId: Joi.string().required(),
      transactionSyncId: Joi.string().required(),
      nodeName: Joi.string().required(),
      vote: Joi.string().valid('approve', 'reject').required(),
      reason: Joi.string().optional().allow(null, ''),
      payloadHash: Joi.string().required(),
    },
  }),
  consensusController.createVote,
);

export default consensusRouter;
