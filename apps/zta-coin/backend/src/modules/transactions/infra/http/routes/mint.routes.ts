import { Router } from 'express';
// import { container } from 'tsyringe'; ❌ not needed

import MintTokenService from '@modules/transactions/services/MintTokenService';

const mintRouter = Router();

mintRouter.post('/', async (request, response) => {
  console.log("🔥 MINT HIT");

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
    return response.status(400).json({
      error: error.message,
    });
  }
});

export default mintRouter;