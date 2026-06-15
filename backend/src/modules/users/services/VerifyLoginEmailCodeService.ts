import { sign } from 'jsonwebtoken';
import { addMinutes, isAfter } from 'date-fns';
import { injectable, inject, container } from 'tsyringe';

import authConfig from '@config/auth';
import ITransactionsRepository from '@modules/transactions/repositories/ITransactionsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';
import AppError from '@shared/errors/AppError';
import User, { EnumStatus } from '../infra/typeorm/entities/User';
import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';

interface IRequest {
  email: string;
  code: string;
}

interface IResponse {
  user: User;
  token: string;
}

@injectable()
class VerifyLoginEmailCodeService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,
  ) {}

  public async execute({ email, code }: IRequest): Promise<IResponse> {
    const normalizedEmail = email
      .replace(/(\+.*)(?=\@)/, '')
      .toLocaleLowerCase();

    const user = await this.usersRepository.findByEmail(normalizedEmail);

    if (!user || !user.pin || !user.pin_created_at) {
      throw new AppError('Invalid or expired login code.', 401);
    }

    if (user.status !== EnumStatus.Active) {
      throw new AppError(
        'Access denied. Please verify your account or contact the system admin.',
        401,
      );
    }

    const codeExpiresAt = addMinutes(user.pin_created_at, 10);

    if (isAfter(Date.now(), codeExpiresAt)) {
      user.pin = null;
      user.pin_created_at = null;
      await this.usersRepository.save(user);
      throw new AppError('Invalid or expired login code.', 401);
    }

    const codeMatched = await this.hashProvider.compareHash(code, user.pin);

    if (!codeMatched) {
      throw new AppError('Invalid or expired login code.', 401);
    }

    user.pin = null;
    user.pin_created_at = null;
    await this.usersRepository.save(user);

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

    let current_balance = 0;
    try {
      current_balance = await this.transactionsRepository.findBalance(user.id);
    } catch (error: any) {
      console.warn(
        `[auth] current balance lookup failed during login verification for user ${user.sync_id}: ${error?.message || error}`,
      );
    }

    const assign = Object.assign(user, {
      current_balance,
      hasVerfiedTwoFactorCode: true,
    });

    try {
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
    } catch (error: any) {
      console.warn(
        `[auth] audit log write failed during login verification for user ${user.sync_id}: ${error?.message || error}`,
      );
    }

    return { user: assign, token };
  }
}

export default VerifyLoginEmailCodeService;
