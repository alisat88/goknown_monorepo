import ICreateOrganizationUserDTO from '../dtos/ICreateOrganizationUserDTO';
import IFindAllUsersByOrganization from '../dtos/IFindAllUsersByOrganization';
import OrganizationUser from '../infra/typeorm/entities/OrganizationUser';

export default interface IOrganizationsUsersRepository {
  findAllUsersByOrganization(
    data: IFindAllUsersByOrganization,
  ): Promise<OrganizationUser[]>;
  findAllOrganizationsByUser(user_id: string): Promise<OrganizationUser[]>;
  findOrganizationByUser(
    user_id: string,
    organization_id: string,
  ): Promise<OrganizationUser | undefined>;
  create(data: ICreateOrganizationUserDTO): Promise<OrganizationUser>;
  createMany(data: ICreateOrganizationUserDTO[]): Promise<OrganizationUser[]>;
  save(data: OrganizationUser): Promise<OrganizationUser>;
  destroy(data: OrganizationUser): Promise<void>;
}
