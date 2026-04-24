import ICreateGroupDTO from '../dtos/ICreateGroupDTO';
import { ISwitchStateByAdminDTO } from '../dtos/ISwitchStateByAdminDTO';
import Group from '../infra/typeorm/entities/Group';

export default interface IGroupsRepository {
  findBySyncId(sync_id: string): Promise<Group | undefined>;
  switchStateByAdmin(data: ISwitchStateByAdminDTO): Promise<void>;
  create(data: ICreateGroupDTO): Promise<Group>;
  save(data: Group): Promise<Group>;
}
