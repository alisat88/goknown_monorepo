import AuthenticateTwoFactorService from '@modules/users/services/AuthenticateTwoFactorService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class TwoFactorSessionAuthenticateController {
  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { twoFactorAuthenticationCode } = request.body;

    const authenticateTwoFactor = container.resolve(
      AuthenticateTwoFactorService,
    );

    await authenticateTwoFactor.execute(
      twoFactorAuthenticationCode,
      user_syncid,
    );

    return response.status(200).send();
  }
}
