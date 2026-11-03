/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateGroupDTO from '../dtos/ICreateGroupDTO';
import { ISwitchStateByAdminDTO } from '../dtos/ISwitchStateByAdminDTO';
import Group from '../infra/typeorm/entities/Group';

export default interface IGroupsRepository {
  findBySyncId(sync_id: string): Promise<Group | undefined>;
  switchStateByAdmin(data: ISwitchStateByAdminDTO): Promise<void>;
  create(data: ICreateGroupDTO): Promise<Group>;
  save(data: Group): Promise<Group>;
}
