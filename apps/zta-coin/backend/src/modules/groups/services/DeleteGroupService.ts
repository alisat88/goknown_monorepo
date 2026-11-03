/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import IGroupsRepository from '../repositories/IGroupsRepository';

@injectable()
class DeleteGroupService {
  constructor(
    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(
    user_syncid: string,
    group_syncid: string,
  ): Promise<void> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // TODO: verify if I can see this folder
    const group = await this.groupsRepository.findBySyncId(group_syncid);

    if (!group) {
      throw new AppError('Group not found');
    }

    if (user.id !== group.owner_id) {
      throw new AppError(`Only owner can delete this group`);
    }

    await this.groupsRepository.destroy(group);
  }
}

export default DeleteGroupService;
