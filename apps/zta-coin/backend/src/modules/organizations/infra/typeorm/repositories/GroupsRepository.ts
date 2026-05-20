import ICreateGroupDTO from '@modules/organizations/dtos/ICreateGroupDTO';
import { ISwitchStateByAdminDTO } from '@modules/organizations/dtos/ISwitchStateByAdminDTO';
import IGroupsRepository from '@modules/organizations/repositories/IGroupsRepository';
import { getRepository, Repository } from 'typeorm';
import Group, { EnumStatus } from '../entities/Group';

class GroupsRepository implements IGroupsRepository {
  private ormRepository: Repository<Group>;

  constructor() {
    this.ormRepository = getRepository(Group);
  }

  public async findBySyncId(sync_id: string): Promise<Group | undefined> {
    const group = this.ormRepository.findOne({
      where: { sync_id, status: EnumStatus.Active },
      relations: ['admin', 'organization', 'rooms', 'rooms.admin', 'rooms.dls'],
    });
    return group;
  }

  public async create(data: ICreateGroupDTO): Promise<Group> {
    const group = this.ormRepository.create(data);

    await this.ormRepository.save(group);

    return group;
  }

  public async save(group: Group): Promise<Group> {
    return await this.ormRepository.save(group);
  }

  public async switchStateByAdmin({
    admin_id,
    organization_id,
    status,
  }: ISwitchStateByAdminDTO): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update(Group)
      .set({
        status,
      })
      .where('admin_id = :admin_id', { admin_id })
      .where('organization_id = :organization_id', { organization_id })
      .execute();
  }
}

export default GroupsRepository;
