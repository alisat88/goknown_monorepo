import AppError from '@shared/errors/AppError';
import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import ITwoFactorProvider from '../providers/TwoFactorProvider/models/ITwoFactorProvider';
import IUsersRepository from '../repositories/IUsersRepository';

@injectable()
export default class CreateTwoFactorService {
  constructor(
    @inject('TwoFactorProvider')
    private twoFactorProvider: ITwoFactorProvider,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(synd_user_id: string, response: Response): Promise<any> {
    // add user twoFactor id on storage session redis
    const user = await this.usersRepository.findBySyncId(synd_user_id);

    if (!user) {
      throw new AppError('User not found');
    }

    if (user.twoFactorAuthenticationCode) {
      throw new AppError('User has 2FA enable, please contact support');
    }

    const { base32, otpauthUrl } = this.twoFactorProvider.generate(user.email);

    user.twoFactorAuthenticationCode = base32;
    this.usersRepository.save(user);

    return this.twoFactorProvider.generateQRCode(otpauthUrl, base32);
  }
}
