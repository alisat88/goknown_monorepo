import { Router } from 'express';
import { ledgerService } from '@shared/ledger/LedgerService';

const velocityRouter = Router();

velocityRouter.get('/:accountId', async (request, response) => {
  try {
    const { accountId } = request.params;

    const data = await ledgerService.getVelocity(accountId);

    return response.json(data);
  } catch (error) {
    return response.status(500).json({
      error: error.message,
    });
  }
});

export default velocityRouter;