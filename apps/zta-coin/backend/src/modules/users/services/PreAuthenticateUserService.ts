import AppError from '@shared/errors/AppError';
import { sign } from 'jsonwebtoken';
import { inject, injectable } from 'tsyringe';
import { v1 as uuid } from 'uuid';

import IHashProvider from '../providers/HashProvider/models/IHashProvider';
import authConfig from '@config/auth';

@injectable()
export default class PreAuthenticateUserService {
  private PREAUTHENTICATION_PASSOWORD?: string;
  private PREAUTHENTICATION_ID?: string;
  constructor(
    @inject('HashProvider')
    private hashProvider: IHashProvider,
  ) {
    this.PREAUTHENTICATION_PASSOWORD = process.env.PREAUTHENTICATION_PASSOWORD;
    this.PREAUTHENTICATION_ID = process.env.PREAUTHENTICATION_ID;
  }

  public async execute(password: string): Promise<string> {
    if (!this.PREAUTHENTICATION_PASSOWORD) {
      throw new AppError('Incorrect password combination.', 401);
    }

    const passwordMatched = await this.hashProvider.compareHash(
      password,
      this.PREAUTHENTICATION_PASSOWORD,
    );

    if (!passwordMatched) {
      throw new AppError('Incorrect password combination.', 401);
    }

    const { secret } = authConfig.jwt;

    const token = sign({}, secret, {
      subject: this.PREAUTHENTICATION_ID || uuid(),
      expiresIn: 999999,
    });

    return token;
  }
}
