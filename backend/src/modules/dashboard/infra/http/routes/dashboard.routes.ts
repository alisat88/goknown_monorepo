import DashboardController from '@modules/dashboard/infra/http/controllers/DashboardController';
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';

const dashboardRoute = Router();
const dashboardController = new DashboardController();

dashboardRoute.use(ensureAuthenticated);

dashboardRoute.get(
  '/',
  /* #swagger.path = '/'
     #swagger.operationId = getDashboard
     #swagger.tags = ['Dashboard']
     #swagger.summary = 'Get Dashboard'
     #swagger.description = 'Get the user dashboard.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'Dashboard retrieved successfully',
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } }
     }
  */
  dashboardController.index,
);

export default dashboardRoute;
