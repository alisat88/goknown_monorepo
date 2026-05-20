import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Folder from '../infra/typeorm/entities/Folder';
import IFoldersRepository from '../repositories/IFoldersRepository';

@injectable()
class FindFolderService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(
    user_syncid: string,
    folder_syncid: string,
  ): Promise<Folder | undefined> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // TODO: Verify if I can share this folder
    const folder = await this.foldersRepository.findBySyncId(folder_syncid);

    return folder;
  }
}

export default FindFolderService;
