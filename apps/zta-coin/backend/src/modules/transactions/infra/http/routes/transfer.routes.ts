import { Router } from 'express';
import TransferTokenService from '@modules/transactions/services/TransferTokenService';

const transferRouter = Router();

transferRouter.post('/', async (request, response) => {
  console.log("💸 TRANSFER HIT");

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
    return response.status(400).json({
      error: error.message,
    });
  }
});

export default transferRouter;