/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ListAllRoomsFoldersService from '@modules/organizations/services/ListAllRoomsFoldersService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

class FoldersController {
  public async index(request: Request, response: Response): Promise<Response> {
    const { room_id } = request.params;

    const listAllRoomsFolders = container.resolve(ListAllRoomsFoldersService);
    const dataforms = await listAllRoomsFolders.execute(room_id);
    return response.json(dataforms);
  }
}

export default FoldersController;
