/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
