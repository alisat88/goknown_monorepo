import { EnumStatus } from '../infra/typeorm/entities/Group';

export interface ISwitchStateByAdminDTO {
  organization_id: string;
  admin_id: string;
  status: EnumStatus;
}
