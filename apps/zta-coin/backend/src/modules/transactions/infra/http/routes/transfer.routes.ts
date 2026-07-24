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
