/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { EnumStatus } from '@modules/organizations/infra/typeorm/entities/Group';
import User from '@modules/users/infra/typeorm/entities/User';
import Group from '../infra/typeorm/entities/Group';

export default interface ICreateGroupsDTO {
  name: string;
  owner_id: string;
  description?: string;
  shared_users?: User[];
  shared_groups?: Group[];
  sync_id: string;
}
