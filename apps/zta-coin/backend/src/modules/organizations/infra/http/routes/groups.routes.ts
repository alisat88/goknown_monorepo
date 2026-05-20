import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';

import GroupController from '../controllers/GroupController';
import syncNodeGroups from '../middlewares/syncNodeGroups';

const groupsRouter = Router();
const groupController = new GroupController();

groupsRouter.use(ensureAuthenticated);

groupsRouter.get(
  '/:id/groups',
  /* #swagger.path = '/organizations/:id/groups'
     #swagger.operationId = listGroups
     #swagger.tags = ['Organizations']
     #swagger.summary = 'List Groups'
     #swagger.description = 'List all groups for an organization.'
     #swagger.security = [{
        "bearerAuth": []
     }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'List of groups for the organization',
     }
          #swagger.responses[200] = {
       description: 'Invitation declined successfully',
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
  groupController.index,
);

groupsRouter.get(
  '/:id/groups/:group_id',
  /* #swagger.path = '/organizations/:id/groups/:group_id'
     #swagger.operationId = getGroup
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Get Group'
     #swagger.description = 'Get details of a specific group within an organization.'
        #swagger.security = [{
        "bearerAuth": []
     }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.parameters['group_id'] = {
       in: 'path',
       name: 'group_id',
       description: 'SYNC_ID of the group to retrieve',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Group details retrieved successfully',
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
      group_id: Joi.string().required(),
    },
  }),
  groupController.show,
);

groupsRouter.post(
  '/:id/groups',
  /* #swagger.path = '/organizations/:id/groups'
     #swagger.operationId = createGroup
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Create Group'
     #swagger.description = 'Create a new group within an organization.'
        #swagger.security = [{
        "bearerAuth": []
     }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        name: 'params',
        description: 'Group information',
        required: true,
        schema: {
          admin_id: "SYNC_ID of the admin user for the group",
          name: "Name of the group",
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
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      admin_id: Joi.string().required(),
      name: Joi.string().required(),
    },
  }),
  syncNodeGroups,
  groupController.create,
);

groupsRouter.put(
  '/:id/groups/:group_id',
  /* #swagger.path = '/organizations/:id/groups/:group_id'
     #swagger.operationId = updateGroup
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Update Group'
     #swagger.description = 'Update details of a specific group within an organization.'
        #swagger.security = [{
        "bearerAuth": []
     }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.parameters['group_id'] = {
       in: 'path',
       name: 'group_id',
       description: 'SYNC_ID of the group to update',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        name: 'params',
        description: 'Group information',
        required: true,
        schema: {
          admin_id: "SYNC_ID of the admin user for the group",
          name: "Name of the group",
        }
     }
     #swagger.responses[200] = {
       description: 'Group details updated successfully',
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
      group_id: Joi.string().required(),
    },
    [Segments.BODY]: {
      admin_id: Joi.string(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      name: Joi.string(),
    },
  }),
  syncNodeGroups,
  groupController.update,
);

export default groupsRouter;
