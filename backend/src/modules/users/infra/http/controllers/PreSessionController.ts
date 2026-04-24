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
