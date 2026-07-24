import { Router } from 'express';

import transferRouter from '@modules/transactions/infra/http/routes/transfer.routes';
import mintRouter from '@modules/transactions/infra/http/routes/mint.routes';
import transactionsRouter from '@modules/transactions/infra/http/routes/transactions.routes';
import velocityRouter from '@modules/transactions/infra/http/routes/velocity.routes';
import ledgerRouter from '@modules/transactions/infra/http/routes/ledger.routes';

import usersRouter from '@modules/users/infra/http/routes/users.routes';
import pinRouter from '@modules/users/infra/http/routes/pin.routes';
import sessionsRouter from '@modules/users/infra/http/routes/sessions.routes';
import recipientsRouter from '@modules/users/infra/http/routes/recipients.routes';
import passwordRouter from '@modules/users/infra/http/routes/password.routes';
import profileRouter from '@modules/users/infra/http/routes/profile.routes';

import chargesRouter from '@modules/charges/infra/http/routes/charges.routes';
import votesRouter from '@modules/votes/infra/http/routes/votes.routes';

import digitalAssetsRouter from '@modules/digitalassets/infra/http/routes/digitalassets.routes';
import foldersRoute from '@modules/digitalassets/infra/http/routes/folders.routes';

import groupsRouter from '@modules/groups/infra/http/routes/groups.routes';
import dataFormsRoute from '@modules/dataforms/infra/http/routes/dataforms.routes';

import conversationsRouter from '@modules/messanger/infra/http/routes/conversations.routes';

import organizationsRouter from '@modules/organizations/infra/http/routes/organizations.routes';
import organizationsGroupsRouter from '@modules/organizations/infra/http/routes/groups.routes';
import organizationsRoomsRouter from '@modules/organizations/infra/http/routes/rooms.routes';

import auditLogsRouter from '@modules/auditlogs/infra/http/routes/auditlogs.routes';
import dlsRouter from '@modules/dls/infra/http/routes/dls.routes';
import adminRouter from '@modules/admin/infra/http/routes/admin.routes';
import dashboardRouter from '@modules/dashboard/infra/http/routes/dashboard.routes';
import laboratoryRouter from '@modules/laboratory/infra/http/routes/laboratory.routes';
import { isDatabaseReady } from '@shared/infra/typeorm';

const routes = Router();

/**
 * Health check
 */
routes.get('/health', (request, response) => {
  return response.json(`Server Connected on node ${process.env.NODE_NUMBER || 1}`);
});

routes.get('/health/live', (_request, response) => {
  return response.json({ status: 'live' });
});

routes.get('/health/ready', async (_request, response) => {
  const ready = await isDatabaseReady();
  return response
    .status(ready ? 200 : 503)
    .json({ status: ready ? 'ready' : 'not_ready', database: ready ? 'connected' : 'unavailable' });
});

/**
 * Auth & user
 */
routes.use('/sessions', sessionsRouter);
routes.use('/users', usersRouter);
routes.use('/pin', pinRouter);

/**
 * User scoped
 */
routes.use('/me/recipients', recipientsRouter);
routes.use('/me/dataforms', dataFormsRoute);
routes.use('/me/dashboard', dashboardRouter);
routes.use('/me/charges', chargesRouter);
routes.use('/me/transactions', transactionsRouter);
routes.use('/me/digitalassets', digitalAssetsRouter);
routes.use('/me/folders', foldersRoute);
routes.use('/me/groups', groupsRouter);

/**
 * Transactions
 */
routes.use('/transfer', transferRouter);
routes.use('/mint', mintRouter);
routes.use('/ledger', ledgerRouter);

/**
 * 🚀 Analytics (NEW FEATURE)
 */
routes.use('/velocity', velocityRouter);

/**
 * Other features
 */
routes.use('/password', passwordRouter);
routes.use('/profile', profileRouter);
routes.use('/votes', votesRouter);
routes.use('/conversations', conversationsRouter);

/**
 * Organizations
 */
routes.use('/organizations', organizationsRouter);
routes.use('/organizations/groups', organizationsGroupsRouter);
routes.use('/organizations/rooms', organizationsRoomsRouter);

/**
 * System
 */
routes.use('/dls', dlsRouter);
routes.use('/auditlogs', auditLogsRouter);
routes.use('/admin', adminRouter);
routes.use('/laboratory', laboratoryRouter);

export default routes;
