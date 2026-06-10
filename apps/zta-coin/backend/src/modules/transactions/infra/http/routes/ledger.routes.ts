import { Router } from 'express';
import { ledgerService } from '@shared/ledger/LedgerService';

const ledgerRouter = Router();

ledgerRouter.get('/', async (request, response) => {
  try {
    const transactions = await ledgerService.getAll();

    return response.json(
      transactions.map(transaction => ({
        id: transaction.id,
        transactionId: transaction.id,
        timestamp: transaction.timestamp,
        type: transaction.type === 'KN-MNT-000' ? 'Mint' : 'Transfer',
        eventCode: transaction.type,
        from: transaction.from || null,
        to: transaction.to || null,
        amount: transaction.amount,
        status: 'Completed',
        note:
          transaction.type === 'KN-MNT-000'
            ? 'ZTA Coin minted into system reserve.'
            : 'ZTA Coin transferred between demo users.',
      })),
    );
  } catch (error) {
    return response.status(500).json({
      error: 'Unable to load transaction ledger.',
    });
  }
});

export default ledgerRouter;
