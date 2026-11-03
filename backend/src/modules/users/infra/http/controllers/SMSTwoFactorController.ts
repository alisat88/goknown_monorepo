/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import SendSMSAuthenticationCode from '@modules/users/services/SendSMSAuthenticationCode';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class SMSTwoFactorController {
  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;

    const sendSMSAuthenticationCode = container.resolve(
      SendSMSAuthenticationCode,
    );

    await sendSMSAuthenticationCode.execute({ user_syncid });

    return response.status(200).send();
  }
}
