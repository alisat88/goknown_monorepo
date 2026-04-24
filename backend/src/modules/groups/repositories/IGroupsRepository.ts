import ICreateGroupsDTO from '../dtos/ICreateGroupsDTO';
import Group from '../infra/typeorm/entities/Group';

export interface IFindById {
  id: string;
  user_id: string;
}

export interface IFindAll {
  user_id?: string;
  sync_ids?: string[];
}

export default interface IGroupsRepository {
  findBySyncId(sync_id: string): Promise<Group | undefined>;
  findAll({ user_id, sync_ids }: IFindAll): Promise<Group[] | undefined>;
  create(data: ICreateGroupsDTO): Promise<Group>;
  save(folder: Group): Promise<Group>;
  destroy(group: Group): Promise<void>;
}
