import { EnumStatus } from '@modules/organizations/infra/typeorm/entities/Group';
import User from '@modules/users/infra/typeorm/entities/User';
import Group from '../infra/typeorm/entities/Group';

export default interface ICreateGroupsDTO {
  name: string;
  owner_id: string;
  description?: string;
  shared_users?: User[];
  shared_groups?: Group[];
  sync_id: string;
}
