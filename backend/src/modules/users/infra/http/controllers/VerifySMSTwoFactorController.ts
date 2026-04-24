import VerifySMSAuthenticationCode from '@modules/users/services/VerifySMSAuthenticationCode';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class VerifySMSTwoFactorController {
  public async create(request: Request, response: Response): Promise<Response> {
    const user_syncid = request.user.sync_id;
    const { twoFactorAuthenticationCode } = request.body;

    const verifySMSAuthenticationCode = container.resolve(
      VerifySMSAuthenticationCode,
    );

    const valid = await verifySMSAuthenticationCode.execute({
      user_syncid,
      code: twoFactorAuthenticationCode,
    });

    return response.json(valid);
  }
}
