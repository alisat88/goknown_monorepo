/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import Group from '@modules/groups/infra/typeorm/entities/Group';
import { EnumPrivacy } from '../infra/typeorm/entities/DataForm';

export default interface ICreateDataFormsDTO {
  name: string;
  description?: string;
  owner_id: string;
  privacy?: EnumPrivacy;
  room_id?: string;
  shared_groups?: Group[];
  sync_id: string;
}
