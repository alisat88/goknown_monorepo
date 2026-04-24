import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { Router } from 'express';
import AuditLogsController from '../controllers/AuditLogsController';

const auditLogsRouter = Router();
const auditLogsController = new AuditLogsController();

auditLogsRouter.use(ensureAuthenticated);

auditLogsRouter.get(
  '/',
  /* #swagger.path = '/auditlogs'
     #swagger.operationId = getAuditLogs
     #swagger.tags = ['Audit Logs']
     #swagger.summary = 'Get Audit Logs'
     #swagger.description = 'Get audit logs for the current user or system.'
      #swagger.security = [{
        "bearerAuth": []
        }]
     #swagger.responses[200] = {
       description: 'Audit logs retrieved successfully',
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
  auditLogsController.index,
);

export default auditLogsRouter;
