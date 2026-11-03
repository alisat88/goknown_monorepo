/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
