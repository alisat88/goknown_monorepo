/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';
import { inject, injectable } from 'tsyringe';
import DigitalAsset from '../infra/typeorm/entities/DigitalAsset';
import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';

@injectable()
class ListAllPublicDigitalAssetsService {
  constructor(
    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(user_id: string): Promise<DigitalAsset[] | undefined> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    const digitalAssets = await this.digitalAssetsRepository.findAllPublic(
      user.id,
    );

    return digitalAssets;
  }
}

export default ListAllPublicDigitalAssetsService;
