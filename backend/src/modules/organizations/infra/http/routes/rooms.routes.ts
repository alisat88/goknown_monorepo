import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import DashboardController from '../controllers/DashboardController';
import FoldersController from '../controllers/FoldersController';
import DigitalAssetsController from '../controllers/DigitalAssetsController';
import OganizationsDataformsController from '../controllers/OganizationsDataformsController';
import OrganizationsUsersRoomsController from '../controllers/OrganizationsUsersRoomsController';

import RoomController from '../controllers/RoomController';
import syncNodeRooms from '../middlewares/syncNodeRooms';

const roomsRouter = Router();
const roomController = new RoomController();
const dashboardController = new DashboardController();
const organizationsUsersRoomsController =
  new OrganizationsUsersRoomsController();

const oganizationsDataformsController = new OganizationsDataformsController();
const digitalAssetsController = new DigitalAssetsController();
const foldersController = new FoldersController();

roomsRouter.use(ensureAuthenticated);

roomsRouter.get(
  '/:id/groups/:group_id/rooms',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms'
     #swagger.operationId = listRooms
     #swagger.tags = ['Organizations']
     #swagger.summary = 'List Rooms in Group'
     #swagger.description = 'List all rooms in a group.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'List of rooms in the group',
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
  }),
  roomController.index,
);

roomsRouter.get(
  '/:id/groups/:group_id/rooms/:room_id',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id'
     #swagger.operationId = getRoomById
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Get Room by ID'
     #swagger.description = 'Get a room by its ID.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room to retrieve',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Room retrieved successfully',
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
      room_id: Joi.string().required(),
    },
  }),
  roomController.show,
);

roomsRouter.post(
  '/:id/groups/:group_id/rooms',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms'
     #swagger.operationId = createRoom
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Create Room'
     #swagger.description = 'Create a new room in a group.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Room creation information',
        required: true,
        schema: {
          name: "Room name",
          dls_syncids: ["dls_syncid_1", "dls_syncid_2"],
        }
     }
     #swagger.responses[201] = {
       description: 'Room created successfully',
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
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      name: Joi.string().required(),
      dls_syncids: Joi.array().items(Joi.string()),
    },
  }),
  syncNodeRooms,
  roomController.create,
);

roomsRouter.put(
  '/:id/groups/:group_id/rooms/:room_id',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id'
     #swagger.operationId = updateRoom
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Update Room'
     #swagger.description = 'Update a room by its ID.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room to update',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Room update information',
        required: true,
        schema: {
          name: "Room name",
          dls_syncids: ["dls_syncid_1", "dls_syncid_2"],
        }
     }
     #swagger.responses[200] = {
       description: 'Room updated successfully',
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
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
      group_id: Joi.string().required(),
      room_id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      name: Joi.string().required(),
      dls_syncids: Joi.array().items(Joi.string()),
    },
  }),
  syncNodeRooms,
  roomController.update,
);

roomsRouter.get(
  '/:id/groups/:group_id/rooms/:room_id/dashboard',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id/dashboard'
     #swagger.operationId = getRoomDashboard
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Get Room Dashboard'
     #swagger.description = 'Get the dashboard data for a room.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room to retrieve the dashboard data for',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Dashboard data retrieved successfully',
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
      room_id: Joi.string().required(),
    },
  }),
  dashboardController.show,
);

roomsRouter.post(
  '/:id/groups/:group_id/rooms/:room_id/add-user',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id/add-user'
     #swagger.operationId = addUserToRoom
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Add User to Room'
     #swagger.description = 'Add a user to a room in a group.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room to add the user to',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'User addition information',
        required: true,
        schema: {
          user_syncid_add: "user_syncid",
        }
     }
     #swagger.responses[200] = {
       description: 'User added to room successfully',
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
      room_id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      user_syncid_add: Joi.string().required(),
    },
  }),
  syncNodeRooms,
  organizationsUsersRoomsController.create,
);

roomsRouter.get(
  '/:id/groups/:group_id/rooms/:room_id/dataforms',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id/dataforms'
     #swagger.operationId = listRoomDataforms
     #swagger.tags = ['Organizations']
     #swagger.summary = 'List Room Dataforms'
     #swagger.description = 'List all dataforms for a room in a group.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room to retrieve dataforms for',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'List of dataforms for the room',
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
      room_id: Joi.string().required(),
    },
  }),
  oganizationsDataformsController.index,
);

roomsRouter.get(
  '/:id/groups/:group_id/rooms/:room_id/folders',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id/folders'
     #swagger.operationId = listRoomFolders
     #swagger.tags = ['Organizations']
     #swagger.summary = 'List Room Folders'
     #swagger.description = 'List all folders for a room in a group.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room to retrieve folders for',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'List of folders for the room',
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
      room_id: Joi.string().required(),
    },
  }),
  foldersController.index,
);

roomsRouter.get(
  '/:id/groups/:group_id/rooms/:room_id/folders/:folder_id',
  /* #swagger.path = '/rooms/:id/groups/:group_id/rooms/:room_id/folders/:folder_id'
     #swagger.operationId = listFolderDigitalAssets
     #swagger.tags = ['Organizations']
     #swagger.summary = 'List Folder Digital Assets'
     #swagger.description = 'List all digital assets in a folder for a room in a group.'
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
       description: 'SYNC_ID of the group',
       required: true,
       type: 'string'
     }
     #swagger.parameters['room_id'] = {
       in: 'path',
       name: 'room_id',
       description: 'SYNC_ID of the room',
       required: true,
       type: 'string'
     }
     #swagger.parameters['folder_id'] = {
       in: 'path',
       name: 'folder_id',
       description: 'SYNC_ID of the folder to retrieve digital assets for',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'List of digital assets in the folder',
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
      room_id: Joi.string().required(),
      folder_id: Joi.string().required(),
    },
  }),
  digitalAssetsController.index,
);

export default roomsRouter;
