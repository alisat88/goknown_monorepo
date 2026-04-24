import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';

export default interface IFindAllUsersByOrganization {
  organization_id: string;
  roles: EnumRole[];
  status: EnumStatus[];
}
