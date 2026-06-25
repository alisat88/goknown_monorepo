import FindDashboardService from '@modules/dashboard/services/findDashboardService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class DashboardController {
  public async index(request: Request, response: Response): Promise<Response> {
    try {
      const dashboardService = container.resolve(FindDashboardService);
      const dashboard = await dashboardService.execute();
      return response.json(classToClass(dashboard));
    } catch (err: any) {
      console.error('[DashboardController] Failed to load dashboard:', err?.message, err);
      return response
        .status(500)
        .json({ status: 'error', message: 'Failed to load dashboard data' });
    }
  }
}
