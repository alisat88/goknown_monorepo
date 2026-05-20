import ICreateOrganizationDTO from '../dtos/ICreateOrganizationDTO';
import Organization from '../infra/typeorm/entities/Organization';

export default interface IOrganizationsRepository {
  findBySyncId(sync_id: string): Promise<Organization | undefined>;
  findById(sync_id: string): Promise<Organization | undefined>;
  create(data: ICreateOrganizationDTO): Promise<Organization>;
  save(data: Organization): Promise<Organization>;
}
