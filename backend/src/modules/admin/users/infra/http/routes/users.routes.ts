import {
  EnumRole,
  EnumStatus,
} from '@modules/users/infra/typeorm/entities/User';
import { Joi, Segments, celebrate } from 'celebrate';
import { Router } from 'express';
import UserController from '../controllers/UserController';
import syncNodeUser from '../middlewares/syncNodeUser';
import syncNodeCharges from '../middlewares/syncNodeCharges';
import IssueTokenController from '../controllers/IssueTokenController';
import uploadConfig from '@config/upload';
import multer from 'multer';
import UploadCSVUserController from '../controllers/UploadCSVUserController';

const upload = multer(uploadConfig.multer);

const issueTokenController = new IssueTokenController();
const userController = new UserController();
const uploadCSVUserController = new UploadCSVUserController();
const usersRouter = Router();

usersRouter.put(
  '/:sync_id',
  /* #swagger.path = '/admin/users/{sync_id}'
     #swagger.operationId = updateUserBySyncId
     #swagger.tags = ['Admin Users']
     #swagger.summary = 'Update User by Sync ID'
     #swagger.description = 'Update user details by Sync ID.'
     #swagger.parameters['sync_id'] = {
       in: 'path',
       name: 'id',
       description: 'Sync ID of the user to update',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'User updated successfully'
     }
  */
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().allow(''),
      // email: Joi.string().email().required(),
      masterNode: Joi.boolean(),
      role: Joi.array().valid(
        EnumRole.Admin,
        EnumRole.Buyer,
        EnumRole.Seller,
        EnumRole.issuer,
      ),
      status: Joi.array().valid(EnumStatus.Inactive, EnumStatus.Active),
    },
  }),
  syncNodeUser,
  userController.update,
);

usersRouter.post(
  '/:sync_id/issue-tokens',
  /* #swagger.path = '/admin/users/{sync_id}/issue-tokens'
     #swagger.operationId = issueTokensForUser
     #swagger.tags = ['Admin Users']
     #swagger.summary = 'Issue Tokens for User by Sync ID'
     #swagger.description = 'Issue tokens for a user by Sync ID.'
     #swagger.parameters['sync_id'] = {
       in: 'path',
       name: 'id',
       description: 'Sync ID of the user to issue tokens to',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Tokens issued successfully'
     }
  */
  celebrate({
    [Segments.BODY]: {
      amount: Joi.string(),
      password: Joi.string(),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeCharges,
  issueTokenController.create,
);

usersRouter.post(
  '/upload',
  /* #swagger.path = '/admin/users/upload'
     #swagger.operationId = uploadCSVUsers
     #swagger.tags = ['Admin Users']
     #swagger.summary = 'Upload CSV File for Users'
     #swagger.description = 'Upload a CSV file to create or update user records.'
     #swagger.responses[200] = {
       description: 'CSV file uploaded successfully'
     }
  */
  upload.single('file'),
  syncNodeCharges,
  uploadCSVUserController.create,
);

export default usersRouter;
