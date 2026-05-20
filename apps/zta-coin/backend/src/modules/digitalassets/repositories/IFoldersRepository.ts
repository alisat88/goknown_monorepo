import ICreateFoldersDTO from '../dtos/ICreateFoldersDTO';
import Folder from '../infra/typeorm/entities/Folder';

export interface IFindById {
  id: string;
  user_id: string;
}

export default interface IFoldersRepository {
  findBySyncId(sync_id: string): Promise<Folder | undefined>;
  findWelcomeFolder(): Promise<Folder | undefined>;
  findAllByRoomId(room_id: string): Promise<Folder[]>;
  findAll(user_id: string): Promise<Folder[] | undefined>;
  create(data: ICreateFoldersDTO): Promise<Folder>;
  save(folder: Folder): Promise<Folder>;
  destroy(folder: Folder): Promise<void>;
}
