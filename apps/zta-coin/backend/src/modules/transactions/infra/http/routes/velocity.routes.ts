/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Router } from 'express';
import { ledgerService } from '@shared/ledger/LedgerService';
import {
  databaseUnavailableResponse,
  isDatabaseInfrastructureError,
} from '@shared/infra/typeorm/databaseErrors';

const velocityRouter = Router();

velocityRouter.get('/:accountId', async (request, response) => {
  try {
    const { accountId } = request.params;

    const data = await ledgerService.getVelocity(accountId);

    return response.json(data);
  } catch (error) {
    if (isDatabaseInfrastructureError(error)) {
      return databaseUnavailableResponse(response);
    }
    return response.status(500).json({
      error: 'Unable to load account velocity.',
    });
  }
});

export default velocityRouter;
