/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import Folder from '@modules/digitalassets/infra/typeorm/entities/Folder';
import IFoldersRepository from '@modules/digitalassets/repositories/IFoldersRepository';
import { inject, injectable } from 'tsyringe';

interface IResponse {
  adminAssets: Folder;
}

@injectable()
class FindDashboardService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,
  ) {}

  async execute(): Promise<IResponse | undefined> {
    const adminFolder = await this.foldersRepository.findWelcomeFolder();

    if (!adminFolder) {
      return { adminAssets: {} as Folder };
    }

    const adminAssets = await this.foldersRepository.findBySyncId(
      adminFolder.sync_id,
    );

    return { adminAssets: adminAssets || ({} as Folder) };
  }
}

export default FindDashboardService;
