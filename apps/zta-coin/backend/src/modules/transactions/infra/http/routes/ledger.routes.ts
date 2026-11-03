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
import { tokenAmountToNumber } from '@shared/amounts/TokenAmount';
import {
  databaseUnavailableResponse,
  isDatabaseInfrastructureError,
} from '@shared/infra/typeorm/databaseErrors';

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
        amount: tokenAmountToNumber(transaction.amount),
        status: 'Completed',
        note:
          transaction.type === 'KN-MNT-000'
            ? 'ZTA Coin minted into system reserve.'
            : 'ZTA Coin transferred between demo users.',
      })),
    );
  } catch (error) {
    if (isDatabaseInfrastructureError(error)) {
      return databaseUnavailableResponse(response);
    }
    return response.status(500).json({
      error: 'Unable to load transaction ledger.',
    });
  }
});

export default ledgerRouter;
