import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import uploadConfig from '@config/upload';
import multer from 'multer';
import OrganizationsController from '../controllers/OrganizationsController';
import syncNodeOrganizations from '../middlewares/syncNodeOrganizations';
import OrganizationAvatarController from '../controllers/OrganizationAvatarController';
import OrganizationsUsersController from '../controllers/OrganizationsUsersController';
import OrganizationInvitationController from '../controllers/OrganizationInvitationController';
import { EnumRole, EnumStatus } from '../../typeorm/entities/OrganizationUser';

const upload = multer(uploadConfig.multer);
const organizationsRouter = Router();
const organizationController = new OrganizationsController();
const organizationAvatarController = new OrganizationAvatarController();
const organizationsUsersController = new OrganizationsUsersController();
const organizationInvitationController = new OrganizationInvitationController();

organizationsRouter.use(ensureAuthenticated);

organizationsRouter.get(
  '/',
  /* #swagger.path = '/organizations'
     #swagger.operationId = getAllOrganizations
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Get All Organizations'
     #swagger.description = 'Get a list of all organizations.'
     #swagger.security = [{
        "bearerAuth": []
        }]
     }}
     #swagger.responses[200] = {
       description: 'Organizations retrieved successfully',
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
  organizationController.index,
);

organizationsRouter.get(
  '/:id',
  /* #swagger.path = '/organizations/:id'
     #swagger.operationId = getOrganizationById
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Get Organization by ID'
     #swagger.description = 'Get an organization by its ID.'
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
       description: 'Organization retrieved successfully',
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
  organizationController.show,
);

organizationsRouter.post(
  '/',
  /* #swagger.path = '/organizations'
     #swagger.operationId = createOrganization
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Create Organization'
     #swagger.description = 'Create a new organization.'
     #swagger.security = [{
        "bearerAuth": []
     }]
     #swagger.parameters['body'] = {
       in: 'body',
       name: 'body',
       description: 'Organization data to be created',
       required: true,
       schema: {
          enable_wallet: true,
          admins_syncid: ['admin_syncid1', 'admin_syncid2'],
          name: 'Organization Name',
          admin_alias: 'Admin Alias',
      }
     }
     #swagger.responses[200] = {
       description: 'Organization created successfully',
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
      enable_wallet: Joi.boolean(),
      admins_syncid: Joi.array().items(Joi.string()),
      name: Joi.string().required(),
      admin_alias: Joi.string().allow(''),
    },
  }),
  syncNodeOrganizations,
  organizationController.create,
);
organizationsRouter.put(
  '/:id',
  /* #swagger.path = '/organizations/:id'
     #swagger.operationId = updateOrganization
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Update Organization by ID'
     #swagger.description = 'Update an organization by its ID.'
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
     #swagger.parameters['body'] = {
       in: 'body',
       name: 'body',
       description: 'Updated organization data',
       required: true,
       schema: {
          enable_wallet: true,
          name: 'Organization Name',
          admin_alias: 'Admin Alias',
       }
     }
     #swagger.responses[200] = {
       description: 'Organization updated successfully',
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
      name: Joi.string().allow(''),
      admin_alias: Joi.string().allow(''),
      enable_wallet: Joi.boolean(),
    },
  }),
  syncNodeOrganizations,
  organizationController.update,
);

organizationsRouter.put(
  '/:id/switch-user',
  /* #swagger.path = '/organizations/:id/switch-user'
     #swagger.operationId = switchUser
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Switch User'
     #swagger.description = 'Switch the user by its ID.'
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
     #swagger.parameters['body'] = {
       in: 'body',
       name: 'body',
       description: 'User data to be switched',
       required: true,
       schema: {
          user_syncid_edited: 'user_syncid_edited',
          sync_id: 'active',
       }
     }
     #swagger.responses[200] = {
       description: 'User switched successfully',
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
      user_syncid_edited: Joi.string().required(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      status: Joi.array().valid(EnumStatus.Active, EnumStatus.Inactive),
    },
  }),
  syncNodeOrganizations,
  organizationsUsersController.update,
);

organizationsRouter.post(
  '/:id/add-user',
  /* #swagger.path = '/organizations/:id/add-user'
     #swagger.operationId = addUser
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Add User'
     #swagger.description = 'Add a user to the organization. role is admin or user'
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
     #swagger.parameters['body'] = {
       in: 'body',
       name: 'body',
       description: 'User data to be added',
       required: true,
       schema: {
          user_syncid_add: 'user_syncid_add',
          role: ['admin'],
       }
     }
     #swagger.responses[200] = {
       description: 'User added successfully',
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
      user_syncid_add: Joi.string().required(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      role: Joi.array().valid(EnumRole.Admin, EnumRole.User),
    },
  }),
  syncNodeOrganizations,
  organizationsUsersController.create,
);

organizationsRouter.patch(
  '/:id/avatar',
  /* #swagger.path = '/organizations/:id/avatar'
     #swagger.operationId = updateAvatar
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Update Avatar'
     #swagger.description = 'Update the organization avatar.'
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
     #swagger.parameters['avatar'] = {
        in: 'formData',
        name: 'avatar',
        description: 'Avatar file to be uploaded',
        required: true,
        type: 'file'
     }
     #swagger.responses[200] = {
       description: 'Avatar updated successfully',
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
      masterNode: Joi.boolean(),
      sync_id: Joi.string(),
    },
  }),
  ensureAuthenticated,
  upload.single('avatar'),
  syncNodeOrganizations,
  organizationAvatarController.update,
);

organizationsRouter.put(
  '/:id/accept-invite',
  /* #swagger.path = '/organizations/:id/accept-invite'
     #swagger.operationId = acceptInvite
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Accept Invite'
     #swagger.description = 'Accept the organization invitation.'
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
       description: 'Invitation accepted successfully',
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
    [Segments.BODY]: [
      {
        sync_id: Joi.string(),
        masterNode: Joi.boolean(),
      },
    ],
  }),
  syncNodeOrganizations,
  organizationInvitationController.update,
);

organizationsRouter.put(
  '/:id/decline-invite',
  /* #swagger.path = '/organizations/:id/decline-invite'
     #swagger.operationId = declineInvite
     #swagger.tags = ['Organizations']
     #swagger.summary = 'Decline Invite'
     #swagger.description = 'Decline the organization invitation.'
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
    [Segments.BODY]: [
      {
        sync_id: Joi.string(),
        masterNode: Joi.boolean(),
      },
    ],
  }),
  syncNodeOrganizations,
  organizationInvitationController.delete,
);

export default organizationsRouter;
