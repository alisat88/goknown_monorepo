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
import IFoldersRepository from '../repositories/IFoldersRepository';

@injectable()
class DeleteFolderService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

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

    // TODO: Verify if I can see this folder
    const group = await this.foldersRepository.findBySyncId(group_syncid);

    if (!group) {
      throw new AppError('Folder not found');
    }

    if (user.id !== group.owner_id) {
      throw new AppError(`Only owner can delete this folder`);
    }

    await this.foldersRepository.destroy(group);
  }
}

export default DeleteFolderService;
