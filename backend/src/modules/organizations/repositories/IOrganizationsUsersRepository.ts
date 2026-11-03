/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
