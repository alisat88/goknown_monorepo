import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';

import SessionsController from '../controllers/SessionsController';
// import PreSessionsController from '../controllers/PreSessionController';
import TwoFactorSessionCreateController from '../controllers/TwoFactorSessionCreateController';
import ensureAuthenticated from '../middlewares/ensureAuthenticated';
import TwoFactorSessionAuthenticateController from '../controllers/TwoFactorSessionAuthenticateController';
import createSyncIdUser from '../middlewares/createSyncIdUser';
import SMSTwoFactorController from '../controllers/SMSTwoFactorController';
import VerifySMSTwoFactorController from '../controllers/VerifySMSTwoFactorController';
const sessionsRouter = Router();
const sessionsController = new SessionsController();
const smsTwoFactorController = new SMSTwoFactorController();
const verifySMSTwoFactorController = new VerifySMSTwoFactorController();

const twoFactorSessionCreateController = new TwoFactorSessionCreateController();
const twoFactorSessionAuthenticateController =
  new TwoFactorSessionAuthenticateController();

// const preSessionsController = new PreSessionsController();

// sessionsRouter.post(
//   '/pre',
//   celebrate({ [Segments.BODY]: { password: Joi.string().required() } }),
//   preSessionsController.create,
// );

sessionsRouter.post(
  '/',
  /*
  #swagger.tags = ['Sessions']
     #swagger.path = '/sessions'
     #swagger.operationId = createSession
     #swagger.summary = 'Create a user session'
     #swagger.description = 'Create a user session by providing email and password.'
    #swagger.parameters['params'] = {
       in: 'body',
       description: 'User email and password',
       required: true,
       schema: {
         email: "user@example.com",
         password: "secretpassword"
       }
     }
     #swagger.responses[200] = {
       description: 'Successful session creation',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } }
     }
     #swagger.responses[400] = {
       description: 'Bad request',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.BODY]: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  }),
  sessionsController.create,
);

sessionsRouter.post(
  '/2fa/generate',
  /* #swagger.tags = ['Sessions']
     #swagger.path = '/sessions/2fa/generate'
     #swagger.operationId = generate2FASession
     #swagger.summary = 'Generate a two-factor authentication session'
     #swagger.description = 'Generate a two-factor authentication session after user authentication.'
      #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.responses[200] = {
       description: 'Two-factor authentication session generated',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } }
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
  createSyncIdUser,
  twoFactorSessionCreateController.create,
);

sessionsRouter.post(
  '/2fa/authenticate',
  /* #swagger.tags = ['Sessions']
     #swagger.path = '/sessions/2fa/authenticate'
     #swagger.operationId = authenticate2FASession
     #swagger.summary = 'Authenticate a two-factor authentication session'
     #swagger.description = 'Authenticate a two-factor authentication session after user authentication.'
     #swagger.parameters['params'] = {
      in: 'body',
      description: 'Two-factor authentication code',
      required: true,
      schema: {
        twoFactorAuthenticationCode: "123456"
      }
     }
      #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.responses[200] = {
       description: 'Two-factor authentication session authenticated',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } }
     }
     #swagger.responses[400] = {
        description: 'Failed to verify 2FA code',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  ensureAuthenticated,
  twoFactorSessionAuthenticateController.create,
);

sessionsRouter.post(
  '/send-sms',
  /* #swagger.tags = ['Sessions']
     #swagger.path = '/sessions/send-sms'
     #swagger.operationId = sendSMS2FA
     #swagger.summary = 'Send SMS for two-factor authentication'
     #swagger.description = 'Send SMS for two-factor authentication after user authentication.'
           #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.responses[200] = {
       description: 'SMS sent for two-factor authentication',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } }
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
  smsTwoFactorController.create,
);

sessionsRouter.post(
  '/verify-sms',
  /* #swagger.tags = ['Sessions']
     #swagger.path = '/sessions/verify-sms'
     #swagger.operationId = verifySMS2FA
     #swagger.summary = 'Verify SMS for two-factor authentication'
     #swagger.description = 'Verify SMS for two-factor authentication after user authentication.'
           #swagger.security = [{
               "bearerAuth": []
        }]
    #swagger.parameters['params'] = {
      in: 'body',
      description: 'Two-factor authentication code',
      required: true,
      schema: {
        twoFactorAuthenticationCode: "123456",
      }
    }
     #swagger.responses[200] = {
       description: 'SMS verified for two-factor authentication',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } }
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
  verifySMSTwoFactorController.create,
);

export default sessionsRouter;
