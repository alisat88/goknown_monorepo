/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
