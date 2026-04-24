import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import GroupsController from '../controller/GroupsController';
import syncNodeGroups from '../middlewares/syncNodeGroups';

const groupsRouter = Router();
const groupsController = new GroupsController();

// Force route to be authenticated
groupsRouter.use(ensureAuthenticated);

groupsRouter.get(
  '/',
  /* #swagger.path = '/me/groups'
     #swagger.operationId = getAllGroups
     #swagger.tags = ['Groups']
     #swagger.summary = 'Get All Groups'
     #swagger.description = 'Get all groups.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'Groups retrieved successfully',
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
  groupsController.index,
);

groupsRouter.get(
  '/:id',
  /* #swagger.path = '/me/groups/:id'
     #swagger.operationId = getGroupById
     #swagger.tags = ['Groups']
     #swagger.summary = 'Get Group by SYNC_ID'
     #swagger.description = 'Get a group by its SYNC_ID.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'sync_id of the group',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Group retrieved successfully',
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
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
  }),
  groupsController.show,
);

groupsRouter.post(
  '/',
  /* #swagger.path = '/me/groups'
     #swagger.operationId = createGroup
     #swagger.tags = ['Groups']
     #swagger.summary = 'Create Group'
     #swagger.description = 'Create a new group.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Group creation information',
        required: true,
        schema: {
          name: "John doe",
          description: "A group for testing",
          shared_users_ids: ["user_sync_id", "user_sync_id"],
        }
     }
     #swagger.responses[201] = {
       description: 'Group created successfully',
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
      sync_id: Joi.string(),
      name: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      shared_users_ids: Joi.array().items(Joi.string()),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeGroups,
  groupsController.create,
);

groupsRouter.put(
  '/:id',
  /* #swagger.path = '/me/groups/:id'
     #swagger.operationId = updateGroup
     #swagger.tags = ['Groups']
     #swagger.summary = 'Update Group'
     #swagger.description = 'Update an existing group.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'sync_id of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Group update information',
        required: true,
        schema: {
          name: "John doe",
          description: "A group for testing",
          shared_users_ids: ["user_sync_id", "user_sync_id"],
        }
     }
     #swagger.responses[200] = {
       description: 'Group updated successfully',
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
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      name: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      shared_users_ids: Joi.array().items(Joi.string()),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeGroups,
  groupsController.update,
);

// groupsRouter.delete(
//   '/:id',
//   celebrate({
//     [Segments.PARAMS]: {
//       id: Joi.string().required(),
//     },
//     [Segments.BODY]: {
//       masterNode: Joi.boolean(),
//     },
//   }),
//   syncNodeGroups,
//   groupsController.destroy,
// );

export default groupsRouter;
