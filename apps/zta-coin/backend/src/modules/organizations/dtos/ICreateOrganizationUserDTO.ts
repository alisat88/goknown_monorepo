import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';

export default interface ICreateOrganizationUserDTO {
  user_id: string;
  // sync_id: string;
  organization_id: string;
  role: EnumRole;
  status: EnumStatus;
}
