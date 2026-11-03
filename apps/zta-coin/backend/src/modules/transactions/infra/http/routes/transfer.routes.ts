/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Router } from 'express';
import TransferTokenService from '@modules/transactions/services/TransferTokenService';
import {
  databaseUnavailableResponse,
  isDatabaseInfrastructureError,
} from '@shared/infra/typeorm/databaseErrors';

const transferRouter = Router();

transferRouter.post('/', async (request, response) => {
  try {
    const { from_user, to_user, amount } = request.body;

    const transferService = new TransferTokenService();

    const result = await transferService.execute({
      from_user,
      to_user,
      amount,
    });

    return response.status(200).json(result);
  } catch (error) {
    if (isDatabaseInfrastructureError(error)) {
      return databaseUnavailableResponse(response);
    }
    return response.status(400).json({
      error: error.message,
    });
  }
});

export default transferRouter;
