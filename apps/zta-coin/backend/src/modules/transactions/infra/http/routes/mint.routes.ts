/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Router } from 'express';
// import { container } from 'tsyringe'; ❌ not needed

import MintTokenService from '@modules/transactions/services/MintTokenService';
import {
  databaseUnavailableResponse,
  isDatabaseInfrastructureError,
} from '@shared/infra/typeorm/databaseErrors';

const mintRouter = Router();

mintRouter.post('/', async (request, response) => {
  try {
    const { user_id, to_user, amount, organization_id } = request.body;

    // ✅ NO dependency injection
    const mintService = new MintTokenService();

    const transaction = await mintService.execute({
      user_id,
      to_user,
      amount,
      organization_id,
    });

    return response.status(201).json(transaction);
  } catch (error) {
    if (isDatabaseInfrastructureError(error)) {
      return databaseUnavailableResponse(response);
    }
    return response.status(400).json({
      error: error.message,
    });
  }
});

export default mintRouter;
