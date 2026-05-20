import { EnumRole } from '../infra/typeorm/entities/User';
export default interface ICreateUserDTO {
  name: string;
  email: string;
  password: string;
  pin: string;
  sync_id: string | undefined;
  pin_created_at?: Date | null | undefined;
  twoFactorAuthentication: boolean;
  role: EnumRole;
}
