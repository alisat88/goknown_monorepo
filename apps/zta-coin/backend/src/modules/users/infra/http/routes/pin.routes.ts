import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';
import PinController from '../controllers/PinController';

import syncNodeUser from '../middlewares/syncNodeUser';

const pinRouter = Router();
const pinController = new PinController();

// Route to resend PIN
pinRouter.post(
  '/resend-pin',
  /* #swagger.path = '/resend-pin'
     #swagger.operationId = resendPin
     #swagger.tags = ['PIN']
     #swagger.summary = 'Resend PIN'
     #swagger.description = 'Resend the PIN for email verification.'
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'User email and PIN',
        required: true,
        schema: {
          email: "johndoe@email.com",
          pin: "123456"
        }
     }
     #swagger.responses[200] = {
       description: 'PIN resent successfully',
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
      pin: Joi.string(),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeUser,
  pinController.create,
);

// Route to confirm email with PIN
pinRouter.put(
  '/confirm-email',
  /* #swagger.path = '/confirm-email'
     #swagger.operationId = confirmEmailWithPIN
     #swagger.tags = ['PIN']
     #swagger.summary = 'Confirm Email with PIN'
     #swagger.description = 'Confirm email by providing the PIN sent to the email address.'
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'User email and PIN',
        required: true,
        schema: {
          email: "johndoe@email.com",
          pin: "123456"
        }
     }
     #swagger.responses[200] = {
       description: 'Email confirmed successfully',
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
      pin: Joi.string().required(),
      email: Joi.string().email().required(),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeUser,
  pinController.update,
);

export default pinRouter;
