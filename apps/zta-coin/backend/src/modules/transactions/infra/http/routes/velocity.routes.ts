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
