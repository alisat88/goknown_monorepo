import Group from '@modules/groups/infra/typeorm/entities/Group';
import { EnumPrivacy } from '../infra/typeorm/entities/DataForm';

export default interface ICreateDataFormsDTO {
  name: string;
  description?: string;
  owner_id: string;
  privacy?: EnumPrivacy;
  room_id?: string;
  shared_groups?: Group[];
  sync_id: string;
}
