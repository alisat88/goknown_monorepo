import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';

import ForgotPasswordController from '../controllers/ForgotPasswordController';
import ResetPasswordController from '../controllers/ResetPasswordController';
import syncNodeUser from '../middlewares/syncNodeUser';

const passwordRouter = Router();
const forgotPasswordController = new ForgotPasswordController();
const resetPasswordController = new ResetPasswordController();

// Route to request password reset
passwordRouter.post(
  '/forgot',
  /* #swagger.path = '/password/forgot'
     #swagger.operationId = forgotPassword
     #swagger.tags = ['Password']
     #swagger.summary = 'Forgot Password'
     #swagger.description = 'Request a password reset by providing your email address.'
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'User email',
        required: true,
        schema: {
          email: "johndoe@email.com"
        }
     }
     #swagger.responses[200] = {
       description: 'Password reset request sent successfully',
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
      email: Joi.string().email().required(),
      token: Joi.string(),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeUser,
  forgotPasswordController.create,
);

// Route to reset password
passwordRouter.post(
  '/reset',
  /* #swagger.path = '/password/reset'
     #swagger.operationId = resetPassword
     #swagger.tags = ['Password']
     #swagger.summary = 'Reset Password'
     #swagger.description = 'Reset your password by providing the reset token and a new password.'
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'User email',
        required: true,
        schema: {
          token: "token_in_email",
          password: "newpassword",
          password_confirmation: "newpassword"
        }
     }
     #swagger.responses[200] = {
       description: 'Password reset successfully',
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
      token: Joi.string().uuid().required(),
      password: Joi.string().required(),
      password_confirmation: Joi.string().required().valid(Joi.ref('password')),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeUser,
  resetPasswordController.create,
);

export default passwordRouter;
