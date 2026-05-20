import { EnumStatus } from '../infra/typeorm/entities/Group';

export default interface ICreateGroupDTO {
  name: string;
  sync_id: string;
  admin_id: string;
  organization_id: string;
  status: EnumStatus;
}
