import ListAllAuditLogsService from '@modules/auditlogs/services/ListAllAuditLogsService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class AuditLogsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const {
      filtered_user_syncid = '',
      limit = 30,
      offset = 0,
      logType = 'All',
    } = request.query;
    try {
      const usersync_id = request.user.sync_id;
      const listAllAuditLogs = container.resolve(ListAllAuditLogsService);
      const auditLogs = await listAllAuditLogs.execute({
        sync_user_id: usersync_id,
        filtered_user_syncid: String(filtered_user_syncid),
        limit: Number(limit),
        offset: Number(offset),
        logType: String(logType),
      });

      return response.json(classToClass(auditLogs));
    } catch (err: any) {
      return response.status(400).json({ error: err.message });
    }
  }
}
