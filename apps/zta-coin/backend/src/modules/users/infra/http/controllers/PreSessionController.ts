/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Request, Response } from 'express';
import { container } from 'tsyringe';

import PreAuthenticateUserService from '@modules/users/services/PreAuthenticateUserService';

export default class PreSessionController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { password } = request.body;

    const preAuthenticateUser = container.resolve(PreAuthenticateUserService);

    const preToken = await preAuthenticateUser.execute(password);

    return response.json({ preToken });
  }
}
