/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ListAllDLsService from '@modules/dls/services/ListAllDLsService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class DLsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listAllDLs = container.resolve(ListAllDLsService);
    const dls = await listAllDLs.execute();

    return response.json(dls);
  }
}

export default DLsController;
