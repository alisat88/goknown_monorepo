import Group from '@modules/groups/infra/typeorm/entities/Group';
import User from '@modules/users/infra/typeorm/entities/User';

export default interface ICreateFoldersDTO {
  name: string;
  owner_id: string;
  shared_users?: User[];
  shared_groups?: Group[];
  sync_id: string;
  room_id?: string;
  editable?: boolean;
  welcome?: boolean;
}
