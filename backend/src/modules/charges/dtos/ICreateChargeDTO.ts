import { EnumMethod, EnumProcess } from '../infra/typeorm/entities/Charge';

export default interface ICreateChargeDTO {
  user_id: string;
  amount: number;
  method: EnumMethod;
  organization_id?: any;
  process?: EnumProcess;
}
