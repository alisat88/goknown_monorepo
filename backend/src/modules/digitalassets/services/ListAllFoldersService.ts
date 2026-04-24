import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Folder from '../infra/typeorm/entities/Folder';
import IFoldersRepository from '../repositories/IFoldersRepository';

@injectable()
class ListAllFoldersService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(user_syncid: string): Promise<Folder[]> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }
    // TODO: Find all folders shared with me
    const userFolders = await this.usersRepository.findAllFolders(user.id);
    if (!userFolders) {
      return [];
    }

    // get only group folder
    const groupFolder: Folder[] = [] as Folder[];
    userFolders.groups.map(group =>
      group.folders.map(folder =>
        groupFolder.push({ ...folder, shared_groups: folder.shared_groups }),
      ),
    );

    let welcomeFolder: Folder[] = [] as Folder[];
    if (user.role === 'admin') {
      welcomeFolder = [
        (await this.foldersRepository.findWelcomeFolder()) || ({} as Folder),
      ];
    }

    const allFolders = [
      ...userFolders.folders,
      ...groupFolder,
      ...welcomeFolder,
    ];

    return allFolders.filter(
      (folder, index, nextFolder) =>
        nextFolder.findIndex(f => f.sync_id === folder.sync_id) === index,
    );
  }
}

export default ListAllFoldersService;
