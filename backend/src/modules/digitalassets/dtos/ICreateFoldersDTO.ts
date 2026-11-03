/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import Group from '@modules/groups/infra/typeorm/entities/Group';
import User from '@modules/users/infra/typeorm/entities/User';

export default interface ICreateFoldersDTO {
  name: string;
  owner_id: string;
  shared_users?: User[];
  shared_groups?: Group[];
  sync_id: string;
  room_id?: string;
  editable?: boolean;
  welcome?: boolean;
}
