/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';
import VotesController from '../controllers/VotesController';

const votesRouter = Router();

const votesController = new VotesController();

votesRouter.use(ensureAuthenticated);

votesRouter.post('/', votesController.create);

votesRouter.delete('/', votesController.destroy);

export default votesRouter;
