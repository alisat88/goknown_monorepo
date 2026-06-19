import { injectable, inject, container } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import User, { EnumStatus } from '../infra/typeorm/entities/User';

import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';
import IPinProvider from '../providers/PinProvider/models/IPinProvider';
import SendLoginEmailCodeService from './SendLoginEmailCodeService';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  verificationRequired: boolean;
  email: string;
}

@injectable()
class AuthenticateUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,

    @inject('PinProvider')
    private pinProvider: IPinProvider,
  ) {}

  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const unAliasesEmail = email
      .trim()
      .replace(/(\+.*)(?=\@)/, '')
      .toLocaleLowerCase();

    const user = await this.usersRepository.findByEmail(
      unAliasesEmail.toLocaleLowerCase(),
    );

    if (!user) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const passwordMatched = await this.hashProvider.compareHash(
      password,
      user.password,
    );

    if (!passwordMatched) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    if (user.status !== EnumStatus.Active) {
      throw new AppError(
        'Access denied. Please verify your account or contact the system admin.',
        401,
      );
    }

    if (!user.twoFactorAuthentication) {
      throw new AppError(
        'Access denied 3. Please contact the system admin.',
        401,
      );
    }

    // TODO: add request/IP based rate limiting for login-code generation.
    const code = await this.pinProvider.generatePin();
    const hashedCode = await this.hashProvider.generateHash(code);
    const pinCreatedAt = new Date();
    await this.usersRepository.updateLoginCode(
      user.id,
      hashedCode,
      pinCreatedAt,
    );

    const sendLoginCode = container.resolve(SendLoginEmailCodeService);
    await sendLoginCode.execute({
      email: user.email,
      name: user.name || user.email,
      code,
    });

    return {
      verificationRequired: true,
      email: user.email,
    };
  }
}

export default AuthenticateUserService;
