import {
  EnumRole,
  EnumStatus,
} from '@modules/users/infra/typeorm/entities/User';

export default interface IUpdateUserDTO {
  name?: string;
  //   email?: string;
  password?: string;
  twoFactorAuthentication?: boolean;
  role?: EnumRole;
  status?: EnumStatus;
}
