import { sign } from 'jsonwebtoken';

import { injectable, inject, container } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import User, { EnumStatus } from '../infra/typeorm/entities/User';

import authConfig from '@config/auth';
import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import SendSMSAuthenticationCode from './SendSMSAuthenticationCode';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';
import DigitalAsset from '@modules/digitalassets/infra/typeorm/entities/DigitalAsset';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: User;
  token: string;
}

@injectable()
class AuthenticateUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,
  ) {}

  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const unAliasesEmail = email
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

    if (user.status === EnumStatus.Inactive) {
      throw new AppError(
        'Access denied 2. Please contact the system admin.',
        401,
      );
    }

    if (!user.twoFactorAuthentication) {
      throw new AppError(
        'Access denied 3. Please contact the system admin.',
        401,
      );
    }

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign(
      {
        twoFactorAuthentication: user.twoFactorAuthentication,
        role: user.role,
      },
      secret,
      {
        subject: user.sync_id,
        expiresIn,
      },
    );

    const current_balance = await this.transactionsRepository.findBalance(
      user.id,
    );

    // console.log(current_balance);

    // send sms auth code if user has phone number
    if (user.phone) {
      const sendSMSAuthenticationCode = container.resolve(
        SendSMSAuthenticationCode,
      );
      await sendSMSAuthenticationCode.execute({ user_syncid: user.sync_id });
    }

    const assign = Object.assign(user, { current_balance });

    // Create Audit Log
    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'login',
      dapp: 'Authenticate',
      sync_id: user.sync_id,
      user_sync_id: user.sync_id,
      dapp_token: user.id,
      dapp_token_sync_id: user.sync_id,
      outcome: 'success',
      message: user,
    });

    return { user: assign, token };
  }
}

export default AuthenticateUserService;
