/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { classToClass } from 'class-transformer';
import { injectable, inject } from 'tsyringe';
import User, { EnumStatus } from '../infra/typeorm/entities/User';
import IUsersRepository from '../repositories/IUsersRepository';

interface IRequest {
  status?: string;
  name?: string;
  limit?: number;
  offset?: number;
}

@injectable()
class ListAllUsersService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    status,
    name,
    limit,
    offset,
  }: IRequest): Promise<User[] | undefined> {
    const arrStatus = (status ? status.split(',') : '') as EnumStatus[];

    const users = await this.usersRepository.findAll({
      status: arrStatus,
      name,
      limit,
      offset,
    });

    return classToClass(users);
  }
}

export default ListAllUsersService;
