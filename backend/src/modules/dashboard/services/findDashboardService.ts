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
