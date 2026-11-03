/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateGroupsDTO from '../dtos/ICreateGroupsDTO';
import Group from '../infra/typeorm/entities/Group';

export interface IFindById {
  id: string;
  user_id: string;
}

export interface IFindAll {
  user_id?: string;
  sync_ids?: string[];
}

export default interface IGroupsRepository {
  findBySyncId(sync_id: string): Promise<Group | undefined>;
  findAll({ user_id, sync_ids }: IFindAll): Promise<Group[] | undefined>;
  create(data: ICreateGroupsDTO): Promise<Group>;
  save(folder: Group): Promise<Group>;
  destroy(group: Group): Promise<void>;
}
