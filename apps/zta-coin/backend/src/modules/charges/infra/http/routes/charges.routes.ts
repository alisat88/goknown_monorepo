import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';
import ChargesController from '../controllers/ChargesController';
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import syncNodeCharge from '../middlewares/syncNodeCharge';

const chargesRoute = Router();
const chargesController = new ChargesController();

chargesRoute.use(ensureAuthenticated);

chargesRoute.get(
  '/',
  /* #swagger.path = '/me/charges'
     #swagger.operationId = getMyCharges
     #swagger.tags = ['Charges']
     #swagger.summary = 'Get My Charges'
     #swagger.description = 'Get all charges associated with the current user.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'Charges retrieved successfully',
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
  chargesController.index,
);

chargesRoute.get(
  '/organizations/:organizationId',
  /* #swagger.path = '/me/charges/organizations/{organizationId}'
     #swagger.operationId = getMyOrganizationCharges
     #swagger.tags = ['Charges']
     #swagger.summary = 'Get My Organization Charges'
     #swagger.description = 'Get all charges associated with the current user in a specific organization.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['organizationId'] = {
       in: 'path',
       name: 'organizationId',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Charges retrieved successfully',
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
  chargesController.index,
);

chargesRoute.post(
  '/',
  /* #swagger.path = '/me/charges'
     #swagger.operationId = createMyCharge
     #swagger.tags = ['Charges']
     #swagger.summary = 'Create My Charge'
     #swagger.description = 'Create a new charge for the current user.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[201] = {
       description: 'Charge created successfully',
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Charge creation information, mount is credit_card, fake or paypal',
        required: true,
        schema: {
          amount: 100,
          method: "credit_card",
        }
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
      amount: Joi.number().required(),
      method: Joi.string().required(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeCharge,
  chargesController.create,
);
chargesRoute.post(
  '/organizations/:organizationId',
  /* #swagger.path = '/me/charges/organizations/{organizationId}'
     #swagger.operationId = createMyOrganizationCharge
     #swagger.tags = ['Charges']
     #swagger.summary = 'Create My Organization Charge'
     #swagger.description = 'Create a new charge for the current user in a specific organization.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['organizationId'] = {
       in: 'path',
       name: 'organizationId',
       description: 'SYNC_ID of the organization',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Charge creation information, mount is credit_card, fake or paypal',
        required: true,
        schema: {
          amount: 100,
          method: "credit_card",
        }
     }
     #swagger.responses[201] = {
       description: 'Charge created successfully',
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
      amount: Joi.number().required(),
      method: Joi.string().required(),
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
    },
  }),
  syncNodeCharge,
  chargesController.create,
);

export default chargesRoute;
