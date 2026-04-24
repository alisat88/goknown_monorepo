import { injectable, inject } from 'tsyringe';
import AppError from '@shared/errors/AppError';
import IUsersRepository from '../repositories/IUsersRepository';
import ISMSTwoFactorProvider from '../providers/TwoFactorProvider/models/ISMSTwoFactorProvider';

interface IRequest {
  user_syncid: string;
}

@injectable()
class SendSMSAuthenticationCode {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('SMSTwoFactorProvider')
    private smsTwoFactorProvider: ISMSTwoFactorProvider,
  ) {}

  public async execute({ user_syncid }: IRequest): Promise<void> {
    const user = await this.usersRepository.findBySyncId(user_syncid);

    if (!user) {
      throw new AppError('user does not exists');
    }

    if (!user.phone) {
      throw new AppError('Phone number not exists');
    }

    await this.smsTwoFactorProvider.generate(user.phone);
  }
}

export default SendSMSAuthenticationCode;
