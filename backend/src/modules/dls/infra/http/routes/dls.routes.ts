import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';

import DLsController from '../controllers/DLsController';

const dlsRouter = Router();

const dLsController = new DLsController();

dlsRouter.use(ensureAuthenticated);

dlsRouter.get(
  '/',
  /* #swagger.path = '/dls'
     #swagger.operationId = getAllDLs
     #swagger.tags = ['DLs']
     #swagger.summary = 'Get All DLs'
     #swagger.description = 'Get all Distribution Lists (DLs).'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'DLs retrieved successfully',
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
  dLsController.index,
);

export default dlsRouter;
