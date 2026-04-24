import ICreateOrganizationDTO from '@modules/organizations/dtos/ICreateOrganizationDTO';
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import { getRepository, Repository } from 'typeorm';

import Organization from '../entities/Organization';

class OrganizationRepository implements IOrganizationsRepository {
  private ormRepository: Repository<Organization>;

  constructor() {
    this.ormRepository = getRepository(Organization);
  }

  public async findById(id: string): Promise<Organization | undefined> {
    const organization = await this.ormRepository.findOne({ where: { id } });

    return organization;
  }

  public async findBySyncId(
    sync_id: string,
  ): Promise<Organization | undefined> {
    const organization = await this.ormRepository.findOne({
      where: { sync_id },

      relations: [
        'owner',
        'groups',
        'groups.admin',
        'groups.rooms',
        'groups.rooms.members',
      ],
    });

    return organization;
  }

  public async create(data: ICreateOrganizationDTO): Promise<Organization> {
    const organization = this.ormRepository.create(data);

    await this.ormRepository.save(organization);

    return organization;
  }

  public async save(organization: Organization): Promise<Organization> {
    return await this.ormRepository.save(organization);
  }
}

export default OrganizationRepository;
