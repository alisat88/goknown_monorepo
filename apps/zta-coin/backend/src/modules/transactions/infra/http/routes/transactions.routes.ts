import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';
import TransactionsController from '../controller/TransactionsController';
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import syncTransaction from '../middlewares/syncTransaction';

const transactionsRoute = Router();
const transactionsController = new TransactionsController();

// Force route to be authenticated
transactionsRoute.use(ensureAuthenticated);

// List all transactions from user
transactionsRoute.get(
  '/',
  /* #swagger.path = '/me/transactions'
     #swagger.operationId = listTransactions
     #swagger.tags = ['Transactions']
     #swagger.summary = 'List User Transactions'
     #swagger.description = 'List all transactions for the authenticated user.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'List of user transactions',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  transactionsController.index,
);

transactionsRoute.get(
  '/organizations/:organizationId',
  /* #swagger.path = '/me/transactions/organizations/{organizationId}'
     #swagger.operationId = listTransactionsByOrganization
     #swagger.tags = ['Transactions']
     #swagger.summary = 'List Transactions by Organization'
     #swagger.description = 'List all transactions for the authenticated user within a specific organization.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['organizationId'] = {
       in: 'path',
       name: 'organizationId',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'List of user transactions within the organization',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  transactionsController.index,
);

// Create new transaction
// celebrate() -> validate all data from transaction
// syncTransaction -> mirror transactions to all nodes registered
// transactionController.create -> init transaction on source node
transactionsRoute.post(
  '/',
  /* #swagger.path = '/me/transactions'
     #swagger.operationId = createTransaction
     #swagger.tags = ['Transactions']
     #swagger.summary = 'Create Transaction'
     #swagger.description = 'Create a new transaction for the authenticated user.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Transaction information',
        required: true,
        schema: {
          amount: 100,
          to_user_id: "to_user_sync_id",
          message: "Transaction message",
        }
     }
     #swagger.responses[201] = {
       description: 'Transaction created successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.BODY]: {
      amount: Joi.number().required(),
      to_user_id: Joi.string().required(),
      message: Joi.string().optional().allow(''),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      timestamp: Joi.number(),
    },
  }),
  syncTransaction,
  transactionsController.create,
);

transactionsRoute.post(
  '/organizations/:organizationId',
  /* #swagger.path = '/me/transactions/organizations/{organizationId}'
     #swagger.operationId = createTransactionByOrganization
     #swagger.tags = ['Transactions']
     #swagger.summary = 'Create Transaction by Organization'
     #swagger.description = 'Create a new transaction for the authenticated user within a specific organization.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['organizationId'] = {
       in: 'path',
       name: 'organizationId',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
      #swagger.parameters['params'] = {
        in: 'body',
        description: 'Transaction information',
        required: true,
        schema: {
          amount: 100,
          to_user_id: "to_user_sync_id",
          message: "Transaction message",
        }
     }
     #swagger.responses[201] = {
       description: 'Transaction created successfully within the organization',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.BODY]: {
      amount: Joi.number().required(),
      to_user_id: Joi.string().required(),
      message: Joi.string().optional().allow(''),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      timestamp: Joi.number(),
    },
  }),
  syncTransaction,
  transactionsController.create,
);

export default transactionsRoute;
