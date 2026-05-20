import FindDashboardService from '@modules/dashboard/services/findDashboardService';
import { classToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class DashboardController {
  public async index(request: Request, response: Response): Promise<Response> {
    const dashboardService = container.resolve(FindDashboardService);
    const dashboard = await dashboardService.execute();

    return response.json(classToClass(dashboard));
  }
}
