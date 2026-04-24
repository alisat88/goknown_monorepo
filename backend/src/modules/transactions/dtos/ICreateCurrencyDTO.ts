import { EnumStatus } from '../infra/typeorm/entities/Currency';

export default interface ICreateCurrencyDTO {
  name?: string;
  organization_id: string;
  sync_id?: string;
  status: EnumStatus;
}
