import Folder from '@modules/digitalassets/infra/typeorm/entities/Folder';
import IFoldersRepository from '@modules/digitalassets/repositories/IFoldersRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import IRoomsRepository from '../repositories/IRoomsRepository';

@injectable()
class ListAllRoomsFoldersService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute(room_syncid: string): Promise<Folder[]> {
    // const user = await this.usersRepository.findBySyncId(user_syncid);
    // if (!user) {
    //   throw new AppError('User not found');
    // }

    const room = await this.organizationsRoomsRepository.findBySyncId(
      room_syncid,
    );

    if (!room) {
      throw new AppError('Room not found');
    }
    // const userFolders = await this.usersRepository.findAllFolders(user.id);
    // if (!userFolders) {
    //   return [];
    // }

    // get only group folder
    // const groupFolder: Folder[] = [] as Folder[];
    // userFolders.groups.map(group =>
    //   group.folders.map(folder =>
    //     groupFolder.push({ ...folder, shared_groups: folder.shared_groups }),
    //   ),
    // );

    // const allFolders = [...userFolders.folders, ...groupFolder];

    // return allFolders.filter(
    //   (folder, index, nextFolder) =>
    //     nextFolder.findIndex(f => f.sync_id === folder.sync_id) === index,
    // );

    const folders = await this.foldersRepository.findAllByRoomId(room.id);

    return folders || [];
  }
}

export default ListAllRoomsFoldersService;
