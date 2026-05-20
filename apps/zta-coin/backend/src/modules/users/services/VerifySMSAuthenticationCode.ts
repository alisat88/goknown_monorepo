import { injectable, inject } from 'tsyringe';
import AppError from '@shared/errors/AppError';
import IUsersRepository from '../repositories/IUsersRepository';
import ISMSTwoFactorProvider from '../providers/TwoFactorProvider/models/ISMSTwoFactorProvider';

interface IRequest {
  user_syncid: string;
  code: string;
}

@injectable()
class VerifySMSAuthenticationCode {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('SMSTwoFactorProvider')
    private smsTwoFactorProvider: ISMSTwoFactorProvider,
  ) {}

  public async execute({ user_syncid, code }: IRequest): Promise<boolean> {
    const user = await this.usersRepository.findBySyncId(user_syncid);

    if (!user) {
      throw new AppError('user does not exists');
    }

    if (!user.phone) {
      throw new AppError('Phone number not exists');
    }

    return await this.smsTwoFactorProvider.verify(user.phone, code);
  }
}

export default VerifySMSAuthenticationCode;
