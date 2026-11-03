/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateOrganizationDTO from '../dtos/ICreateOrganizationDTO';
import Organization from '../infra/typeorm/entities/Organization';

export default interface IOrganizationsRepository {
  findBySyncId(sync_id: string): Promise<Organization | undefined>;
  findById(sync_id: string): Promise<Organization | undefined>;
  create(data: ICreateOrganizationDTO): Promise<Organization>;
  save(data: Organization): Promise<Organization>;
}
