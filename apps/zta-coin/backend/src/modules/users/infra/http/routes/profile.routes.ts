import { Router } from 'express';
import { celebrate, Segments, Joi } from 'celebrate';

import ProfileController from '../controllers/ProfileController';
import ensureAuthenticated from '../middlewares/ensureAuthenticated';
import syncNodeUser from '../middlewares/syncNodeUser';

const profileRouter = Router();
const profileController = new ProfileController();

profileRouter.use(ensureAuthenticated);

// Route to display user profile
profileRouter.get(
  '/',
  /* #swagger.tags = ['Profile']
     #swagger.path = '/profile'
     #swagger.operationId = getProfile
     #swagger.summary = 'Get user profile'
     #swagger.description = 'Retrieve the user profile information.'
      #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'User profile',
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
  profileController.show,
);

// Route to update user profile
profileRouter.put(
  '/',
  /* #swagger.tags = ['Profile']
     #swagger.path = '/profile'
     #swagger.operationId = updateProfile
     #swagger.summary = 'Update user profile'
     #swagger.description = 'Update the user profile information.'
     #swagger.security = [{
      "bearerAuth": []
      }]
      #swagger.parameters['params'] = {
      in: 'body',
      description: 'User profile update information',
      required: true,
      schema: {
        name: "John doe",
        phone: 12035551234,
        old_password: "oldpassword",
        password: "newpassword",
        password_confirmation: "newpassword",
      }
    }
     #swagger.responses[200] = {
       description: 'User profile updated successfully',
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
      masterNode: Joi.boolean(),
      name: Joi.string(),
      phone: Joi.string(),
      old_password: Joi.string(),
      password: Joi.string(),
      password_confirmation: Joi.string().valid(Joi.ref('password')),
    },
  }),
  syncNodeUser,
  profileController.update,
);

export default profileRouter;
