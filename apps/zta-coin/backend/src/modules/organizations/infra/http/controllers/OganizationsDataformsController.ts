/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ListAllDataFormsService from '@modules/organizations/services/ListAllDataFormsService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class OganizationsDataformsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { id: organization_syncid, room_id } = request.params;

    const listAllDataForms = container.resolve(ListAllDataFormsService);
    const dataforms = await listAllDataForms.execute({
      organization_syncid,
      room_syncid: room_id,
      user_syncid,
    });
    return response.json(dataforms);
  }
}

export default OganizationsDataformsController;
