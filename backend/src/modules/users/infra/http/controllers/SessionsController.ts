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

import AuthenticateUserService from '@modules/users/services/AuthenticateUserService';
import VerifyLoginEmailCodeService from '@modules/users/services/VerifyLoginEmailCodeService';
import { classToClass } from 'class-transformer';

export default class SessionsController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;

    const authenticateUser = container.resolve(AuthenticateUserService);

    const sessionChallenge = await authenticateUser.execute({
      email,
      password,
    });

    return response.json(sessionChallenge);
  }

  public async verifyEmailCode(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const { email, code } = request.body;

    const verifyLoginEmailCode = container.resolve(VerifyLoginEmailCodeService);

    const { user, token } = await verifyLoginEmailCode.execute({
      email,
      code,
    });

    return response.json({ user: classToClass(user), token });
  }
}
