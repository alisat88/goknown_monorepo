import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';
import multer from 'multer';
import uploadConfig from '@config/upload';

import UsersController from '../controllers/UsersController';
import UserAvatarController from '../controllers/UserAvatarController';
import InviteUsersController from '../controllers/InviteUsersController';
import ensureAuthenticated from '../middlewares/ensureAuthenticated';
import createSyncIdUser from '../middlewares/createSyncIdUser';
import { EnumRole } from '../../typeorm/entities/User';

const usersRouter = Router();
const upload = multer(uploadConfig.multer);
const usersController = new UsersController();
const userAvatarController = new UserAvatarController();
const inviteUsersController = new InviteUsersController();

usersRouter.get(
  '/',
  /*
  #swagger.tags = ['Users']
  #swagger.path = '/users'
  #swagger.operationId = getUsers
  #swagger.summary = 'Get list of users'
  #swagger.description = 'Retrieve a list of all users.'
  #swagger.security = [{
    "bearerAuth": []
  }]
  #swagger.responses[200] = {
    description: 'List of users',
  }
  #swagger.responses[401] = {
    description: 'Unauthorized',
     content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
  }
   #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
 */
  ensureAuthenticated,
  usersController.index,
);

usersRouter.post(
  '/',
  /*
    #swagger.tags = ['Users']
    #swagger.path = '/users'
    #swagger.operationId = createUser
    #swagger.summary = 'Create a user'
    #swagger.description = 'Create a new user with the provided information.'
    #swagger.parameters['params'] = {
     in: 'body',
     description: 'User email and password',
     required: true,
     schema: {
       email: "johndoe@email.com",
       password: "secretpassword",
       name: "John Doe",
       pin: "123456",
       ignoreWelcomeEmail: false,
     }
   }
    #swagger.responses[201] = {
      description: 'User created successfully',
    }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
    }
   */

  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      pin: Joi.string(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      ignoreWelcomeEmail: Joi.boolean(),
      limit: Joi.number(),
      offset: Joi.number(),
    },
  }),
  createSyncIdUser,
  usersController.create,
);

usersRouter.post(
  '/invite',
  /*
    #swagger.tags = ['Users']
    #swagger.path = '/users/invite'
    #swagger.operationId = inviteUser
    #swagger.summary = 'Invite a user'
    #swagger.description = 'Invite a new user with the provided information. roles can be admin, buyer, seller, issuer.'
    #swagger.security = [{
    "bearerAuth": []
    }]
    #swagger.parameters['params'] = {
      in: 'body',
      description: 'User details',
      required: true,
      schema: {
        name: "John doe",
        email: "johndoe@email.com",
        role: "admin",
        amount: 100,
        password: 123456,
        pin: 123456,
      }
    }
    #swagger.responses[201] = {
      description: 'User invited successfully',
    }
    #swagger.responses[401] = {
      description: 'Unauthorized',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
    }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
    }
   */
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().allow(''),
      email: Joi.string().email().required(),
      role: Joi.array().valid(
        EnumRole.Admin,
        EnumRole.Buyer,
        EnumRole.Seller,
        EnumRole.issuer,
      ),

      amount: Joi.number().allow(''),
      password: Joi.string(),
      pin: Joi.string(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
    },
  }),
  ensureAuthenticated,
  createSyncIdUser,
  inviteUsersController.create,
);

usersRouter.put(
  '/:id',
  /*
    #swagger.tags = ['Users']
    #swagger.path = '/users/{id}'
    #swagger.operationId = updateUser
    #swagger.summary = 'Update a user'
    #swagger.description = 'Update an existing user with the provided information.'
    #swagger.parameters['UserId'] = {
      in: 'path',
      name: 'id',
      description: 'User ID',
      required: true,
      type: 'integer'
    }
    #swagger.security = [{
    "bearerAuth": []
    }]
    #swagger.parameters['params'] = {
      in: 'body',
      description: 'User details',
      required: true,
      schema: {
        phone: 12035551234,
        twoFactorAuthenticationCode: 123456
      }
    }
    #swagger.responses[200] = {
      description: 'User updated successfully',
    }
  #swagger.responses[401] = {
    description: 'Unauthorized',
     content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
  }
   #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
    }
   */
  celebrate({
    [Segments.BODY]: {
      sync_id: Joi.string(),
      phone: Joi.string(),
      twoFactorAuthenticationCode: Joi.string(),
    },
  }),
  ensureAuthenticated,
  usersController.update,
);

usersRouter.patch(
  '/avatar',
  /*
    #swagger.tags = ['Users']
    #swagger.path = '/users/avatar'
    #swagger.operationId = updateUserAvatar
    #swagger.summary = 'Update user avatar'
    #swagger.description = 'Update the avatar of an existing user.'
    #swagger.security = [{
      "bearerAuth": []
    }]
        #swagger.parameters['avatar'] = {
     in: 'formData',
     type: 'file',
     description: 'User avatar image',
     required: true
   }
   #swagger.responses[200] = {
      description: 'User avatar updated successfully',
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
  ensureAuthenticated,
  upload.single('avatar'),
  userAvatarController.update,
);

export default usersRouter;
