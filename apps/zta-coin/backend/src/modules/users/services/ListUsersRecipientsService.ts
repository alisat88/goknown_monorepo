/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { inject, injectable } from 'tsyringe';
import User from '../infra/typeorm/entities/User';
import IRecipientsUsersRepository from '../repositories/IRecipientsUsersRepository';
import { classToClass } from 'class-transformer';
import IUsersRepository from '../repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  user_id: string;
}

@injectable()
class ListUsersRecipientsService {
  constructor(
    @inject('RecipientsUsersRepository')
    private recipientsUsersRepository: IRecipientsUsersRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({ user_id }: IRequest): Promise<User[] | undefined> {
    const user = await this.usersRepository.findBySyncId(user_id);

    if (!user) {
      throw new AppError('User not exits');
    }

    const recipientsUsers = await this.recipientsUsersRepository.findAllRecipient(
      user.id,
    );

    return classToClass(recipientsUsers);
  }
}

export default ListUsersRecipientsService;
