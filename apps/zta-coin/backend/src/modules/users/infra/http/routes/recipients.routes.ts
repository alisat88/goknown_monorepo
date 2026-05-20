import { Router } from 'express';

import RecipientsController from '../controllers/RecipientsController';
import ensureAuthenticated from '../middlewares/ensureAuthenticated';
import syncNodeUser from '../middlewares/syncNodeUser';

const recipientRouter = Router();
const recipientsController = new RecipientsController();

recipientRouter.use(ensureAuthenticated);

// Route to list all recipients
recipientRouter.get(
  '/me/recipients',
  /* #swagger.tags = ['Recipients']
     #swagger.path = '/me/recipients'
     #swagger.operationId = getRecipients
     #swagger.summary = 'Get list of recipients'
     #swagger.description = 'Retrieve a list of all recipients.'
     #swagger.security = [{
      "bearerAuth": []
     }]
     #swagger.responses[200] = {
       description: 'List of recipients',
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
  recipientsController.index,
);

// Route to create a new recipient
recipientRouter.post(
  '/me/recipients',
  /* #swagger.tags = ['Recipients']
     #swagger.path = '/me/recipients'
     #swagger.operationId = createRecipient
     #swagger.summary = 'Create a new recipient'
     #swagger.description = 'Create a new recipient for transactions.'
     #swagger.security = [{
      "bearerAuth": []
     }]
     #swagger.parameters['params'] = {
      in: 'body',
      description: 'Recipient information, in recipient_id value use user sync_id',
      required: true,
      schema: {
        recipient_id: 1
       }
    }
     #swagger.responses[201] = {
       description: 'Recipient created successfully',
       schema: {
         $ref: '#/definitions/Recipient'
       }
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
  syncNodeUser,
  recipientsController.create,
);

// // Route to delete a recipient by ID
// recipientRouter.delete(
//   '/me/recipients/:recipientId',
//   /* #swagger.tags = ['Recipients']
//      #swagger.path = '/me/recipients/{recipientId}'
//      #swagger.operationId = deleteRecipient
//      #swagger.summary = 'Delete a recipient by ID'
//      #swagger.description = 'Delete a recipient by providing its ID.'
//      #swagger.security = [{
//       "bearerAuth": []
//      }]
//      #swagger.parameters['recipientId'] = {
//        in: 'path',
//        name: 'recipientId',
//        description: 'SYNC_ID of the recipient to delete',
//        required: true,
//        type: 'integer'
//      }
//      #swagger.responses[204] = {
//        description: 'Recipient deleted successfully'
//      }
//           #swagger.responses[400] = {
//         description: 'Bad request',
//         content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
//      }
//      #swagger.responses[401] = {
//         description: 'Unauthorized',
//         content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
//      }
//      #swagger.responses[403] = {
//         description: 'Forbidden',
//         content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
//      }
//   */
//   recipientsController.destroy,
// );

export default recipientRouter;
