import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';
import ConversationController from '../controllers/ConversationController';
import MessageController from '../controllers/MessageController';

import syncNodeMessanger from '../middlewares/syncNodeMessanger';

const conversationsRouter = Router();
const conversationController = new ConversationController();
const messageController = new MessageController();

// Force route to be authenticated
conversationsRouter.use(ensureAuthenticated);

conversationsRouter.get(
  '/:receiverId',
  /* #swagger.path = '/conversations/:receiverId'
     #swagger.operationId = getConversationByReceiverId
     #swagger.tags = ['Conversations']
     #swagger.summary = 'Get Conversation by Receiver ID'
     #swagger.description = 'Get a conversation by the receiver ID.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['receiverId'] = {
       in: 'path',
       name: 'receiverId',
       description: 'SYNC_ID of the receiver',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Conversation retrieved successfully',
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
  conversationController.show,
);
conversationsRouter.get(
  '/',
  /* #swagger.path = '/conversations'
    #swagger.operationId = getAllConversations
    #swagger.tags = ['Conversations']
    #swagger.summary = 'Get All Conversations'
    #swagger.description = 'Get all conversations.'
    #swagger.security = [{
      "bearerAuth": []
      }]
    #swagger.responses[200] = {
      description: 'Conversations retrieved successfully',
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
  conversationController.index,
);
conversationsRouter.post(
  '/',
  /* #swagger.path = '/conversations'
     #swagger.operationId = createConversation
     #swagger.tags = ['Conversations']
     #swagger.summary = 'Create Conversation'
     #swagger.description = 'Create a new conversation.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Conversation information',
        required: true,
        schema: {
          receiver_id: "receiver_user_sync_id"
        }
     }
     #swagger.responses[201] = {
       description: 'Conversation created successfully',
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
  */ syncNodeMessanger,
  conversationController.create,
);

conversationsRouter.get(
  '/:id/messages',
  /* #swagger.path = '/conversations/:id/messages'
     #swagger.operationId = getMessagesByConversationId
     #swagger.tags = ['Conversations']
     #swagger.summary = 'Get Messages by Conversation ID'
     #swagger.description = 'Get messages of a conversation by its ID.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the conversation',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Messages retrieved successfully',
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
  messageController.index,
);
conversationsRouter.post(
  '/:id/messages',
  /* #swagger.path = '/conversations/:id/messages'
     #swagger.operationId = createMessageInConversation
     #swagger.tags = ['Conversations']
     #swagger.summary = 'Create Message in Conversation'
     #swagger.description = 'Create a new message in a conversation.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Message information',
        required: true,
        schema: {
          text: "Hello, how are you?"
        }
     }
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'Sync ID of the conversation',
       required: true,
       type: 'string'
     }
     #swagger.responses[201] = {
       description: 'Message created successfully',
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
  syncNodeMessanger,
  messageController.create,
);

export default conversationsRouter;
