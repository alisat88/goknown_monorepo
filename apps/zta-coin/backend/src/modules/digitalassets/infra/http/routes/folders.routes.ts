import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import FoldersController from '../controller/FoldersController';
import syncNodeFolders from '../middlewares/syncNodeFolders';

const foldersRoute = Router();
const foldersController = new FoldersController();

// Force route to be authenticated
foldersRoute.use(ensureAuthenticated);

foldersRoute.get(
  '/',
  /* #swagger.path = '/me/folders'
     #swagger.operationId = getMyFolders
     #swagger.tags = ['Folders']
     #swagger.summary = 'Get Admin Folder'
     #swagger.description = 'Get all my folders.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'Folders retrieved successfully',
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
  foldersController.index,
);

foldersRoute.get(
  '/:id',
  /* #swagger.path = '/me/folders/{id}'
     #swagger.operationId = getMyFolderById
     #swagger.tags = ['Folders']
     #swagger.summary = 'Get My Folder by sync_id'
     #swagger.description = 'Get a folder by its sync_id.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'sync_id of the folder',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Folder retrieved successfully',
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
  foldersController.show,
);
foldersRoute.post(
  '/',
  /* #swagger.path = '/me/folders'
     #swagger.operationId = createMyFolder
     #swagger.tags = ['Folders']
     #swagger.summary = 'Create My Folder'
     #swagger.description = 'Create a new folder.'
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Folder creation information',
        required: true,
        schema: {
          name: "My Folder",
          room_syncid: "room_syncid",
          welcome: false,
          shared_users_ids: ["user_syncid1", "user_syncid2"],
          shared_groups_ids: ["group_syncid1", "group_syncid2"],
        }
     }
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[201] = {
       description: 'Folder created successfully',
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
      masterNode: Joi.boolean(),
      editable: Joi.boolean().default(true),
      welcome: Joi.boolean().default(false),
      name: Joi.string().required(),
      room_syncid: Joi.string(),
      shared_users_ids: Joi.array().items(Joi.string()),
      shared_groups_ids: Joi.array().items(Joi.string()),
    },
  }),
  syncNodeFolders,
  foldersController.create,
);

foldersRoute.put(
  '/:id',
  /* #swagger.path = '/me/folders/{id}'
     #swagger.operationId = updateMyFolder
     #swagger.tags = ['Folders']
     #swagger.summary = 'Update My Folder'
     #swagger.description = 'Update an existing folder.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'sync_id of the folder',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Folder update information',
        required: true,
        schema: {
          name: "My Folder",
          welcome: false,
          room_syncid: "room_syncid",
          shared_users_ids: ["user_syncid1", "user_syncid2"],
          shared_groups_ids: ["group_syncid1", "group_syncid2"],
        }
     }
     #swagger.responses[200] = {
       description: 'Folder updated successfully',
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
      welcome: Joi.boolean().default(false),
      name: Joi.string().required(),
      room_syncid: Joi.string(),
      shared_users_ids: Joi.array().items(Joi.string()),
      shared_groups_ids: Joi.array().items(Joi.string()),
    },
  }),
  syncNodeFolders,
  foldersController.update,
);

// foldersRoute.delete(
//   '/:id',
//   celebrate({
//     [Segments.PARAMS]: {
//       id: Joi.string().required(),
//     },
//     [Segments.BODY]: {
//       masterNode: Joi.boolean(),
//     },
//   }),
//   syncNodeFolders,
//   foldersController.destroy,
// );

export default foldersRoute;
