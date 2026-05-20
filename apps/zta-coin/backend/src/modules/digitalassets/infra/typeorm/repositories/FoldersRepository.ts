import ICreateFoldersDTO from '@modules/digitalassets/dtos/ICreateFoldersDTO';
import IFolderRepository from '@modules/digitalassets/repositories/IFoldersRepository';
import { getRepository, Repository } from 'typeorm';
import Folder from '../entities/Folder';

export default class FoldersRepository implements IFolderRepository {
  private ormRepository: Repository<Folder>;

  constructor() {
    this.ormRepository = getRepository(Folder);
  }

  public async findBySyncId(sync_id: string): Promise<Folder | undefined> {
    const folder = this.ormRepository.findOne({
      where: { sync_id },
      relations: ['shared_users', 'shared_groups', 'assets', 'owner'],
    });
    return folder;
  }

  public async findAll(user_id: string): Promise<Folder[] | undefined> {
    const folders = this.ormRepository.find({
      where: { user_id },
      relations: ['shared_users', 'user'],
    });
    return folders;
  }

  public async findAllByRoomId(room_id: string): Promise<Folder[]> {
    const folders = this.ormRepository.find({
      where: { room_id },
      relations: ['shared_users'],
    });
    return folders;
  }

  public async findWelcomeFolder(): Promise<Folder | undefined> {
    const folder = this.ormRepository.findOne({
      where: { welcome: true },
      relations: ['shared_users', 'shared_groups', 'assets', 'owner'],
    });
    return folder;
  }

  public async create(folderData: ICreateFoldersDTO): Promise<Folder> {
    const folder = this.ormRepository.create({
      name: folderData.name,
      owner_id: folderData.owner_id,
      sync_id: folderData.sync_id,
      editable: folderData.editable,
      shared_groups: folderData.shared_groups,
      room_id: folderData.room_id,
    });

    // verify if exists user to share folder
    if (folderData.shared_users) {
      folder.shared_users = folderData.shared_users;
    }
    await this.ormRepository.save(folder);

    return folder;
  }

  public async save(folder: Folder): Promise<Folder> {
    return await this.ormRepository.save(folder);
  }

  public async destroy(folder: Folder): Promise<void> {
    // remove digitalassets from folder

    await this.ormRepository.remove(folder);
  }
}
