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
    const { user_id, amount, organization_id } = request.body;

    // ✅ NO dependency injection
    const mintService = new MintTokenService();

    const transaction = await mintService.execute({
      user_id,
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
