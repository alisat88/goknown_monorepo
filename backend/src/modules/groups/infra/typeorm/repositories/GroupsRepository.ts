import ICreateGroupsDTO from '@modules/groups/dtos/ICreateGroupsDTO';
import IGroupsRepository, {
  IFindAll,
} from '@modules/groups/repositories/IGroupsRepository';
import { getRepository, In, Repository } from 'typeorm';
import Group from '../entities/Group';

export default class GroupsRepository implements IGroupsRepository {
  private ormRepository: Repository<Group>;

  constructor() {
    this.ormRepository = getRepository(Group);
  }

  public async findBySyncId(sync_id: string): Promise<Group | undefined> {
    const group = this.ormRepository.findOne({
      where: { sync_id },
      relations: ['shared_users', 'owner'],
    });
    return group;
  }

  public async findAll({
    user_id,
    sync_ids,
  }: IFindAll): Promise<Group[] | undefined> {
    const inQuery = sync_ids ? { sync_id: In(sync_ids) } : null;
    const folders = this.ormRepository.find({
      where: { ...inQuery },
      relations: ['shared_users', 'owner'],
    });

    return folders;
  }

  public async create(groupData: ICreateGroupsDTO): Promise<Group> {
    const folder = this.ormRepository.create({
      name: groupData.name,
      owner_id: groupData.owner_id,
      sync_id: groupData.sync_id,
      description: groupData.description,
    });

    // verify if exists user to share folder
    if (groupData.shared_users) {
      folder.shared_users = groupData.shared_users;
    }
    await this.ormRepository.save(folder);

    return folder;
  }

  public async save(folder: Group): Promise<Group> {
    return await this.ormRepository.save(folder);
  }

  public async destroy(group: Group): Promise<void> {
    await this.ormRepository.remove(group);
  }
}
