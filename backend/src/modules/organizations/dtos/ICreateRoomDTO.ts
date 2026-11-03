/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import DL from '@modules/dls/infra/typeorm/entities/DL';

export default interface ICreateRoomDTO {
  name: string;
  sync_id: string;
  admin_id: string;
  group_id: string;
  dls?: DL[];
}
