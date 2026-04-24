import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import ITwoFactorProvider from '../providers/TwoFactorProvider/models/ITwoFactorProvider';
import IUsersRepository from '../repositories/IUsersRepository';

@injectable()
export default class AuthenticateTwoFactorService {
  constructor(
    @inject('TwoFactorProvider')
    private twoFactorProvider: ITwoFactorProvider,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(
    twoFactorAuthenticationCode: string,
    user_sync_id: string,
  ): Promise<boolean> {
    const user = await this.usersRepository.findBySyncId(user_sync_id);
    if (!user) {
      throw new AppError('User not found');
    }

    if (!user.twoFactorAuthenticationCode) {
      throw new AppError('Failed to verify 2FA code', 400);
    }

    // let isVerified = false;
    // if (process.env.NODE_ENV !== 'development') {
    const isVerified = await this.twoFactorProvider.verify(
      twoFactorAuthenticationCode,
      user.twoFactorAuthenticationCode,
    );
    // }

    if (isVerified) {
      return isVerified;
    } else {
      throw new AppError('Failed to verify 2FA code', 400);
    }
  }
}
