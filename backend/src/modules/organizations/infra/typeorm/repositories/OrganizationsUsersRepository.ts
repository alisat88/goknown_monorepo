import ICreateOrganizationUserDTO from '@modules/organizations/dtos/ICreateOrganizationUserDTO';
import IFindAllUsersByOrganization from '@modules/organizations/dtos/IFindAllUsersByOrganization';
import IOrganizationsUsersRepository from '@modules/organizations/repositories/IOrganizationsUsersRepository';
import { getRepository, In, Repository } from 'typeorm';
import OrganizationUser from '../entities/OrganizationUser';

class OrganizationsUsersRepository implements IOrganizationsUsersRepository {
  private ormRepository: Repository<OrganizationUser>;

  constructor() {
    this.ormRepository = getRepository(OrganizationUser);
  }

  public async findOrganizationByUser(
    user_id: string,
    organization_id: string,
  ): Promise<OrganizationUser | undefined> {
    const organizationUser = await this.ormRepository.findOne({
      where: {
        user_id,
        organization_id,
      },
    });

    return organizationUser;
  }

  public async findAllUsersByOrganization(
    data: IFindAllUsersByOrganization,
  ): Promise<OrganizationUser[]> {
    const organizationUser = this.ormRepository.find({
      where: {
        organization_id: data.organization_id,
        role: In([...data.roles]),
        status: In([...data.status]),
      },
      relations: ['user'],
    });

    return organizationUser;
  }

  public async findAllOrganizationsByUser(
    user_id: string,
  ): Promise<OrganizationUser[]> {
    const organizationsUsers = this.ormRepository.find({
      where: { user_id },
      relations: ['organization'],
    });

    return organizationsUsers;
  }

  public async create(
    data: ICreateOrganizationUserDTO,
  ): Promise<OrganizationUser> {
    const organizationUser = this.ormRepository.create(data);

    await this.ormRepository.save(organizationUser);

    return organizationUser;
  }

  public async createMany(
    data: ICreateOrganizationUserDTO[],
  ): Promise<OrganizationUser[]> {
    const organizationUser = this.ormRepository.create(data);

    await this.ormRepository.save(organizationUser);

    return organizationUser;
  }

  public async save(
    organizationUser: OrganizationUser,
  ): Promise<OrganizationUser> {
    return await this.ormRepository.save(organizationUser);
  }

  public async destroy(organizationUser: OrganizationUser): Promise<void> {
    await this.ormRepository.remove(organizationUser);
  }
}

export default OrganizationsUsersRepository;
