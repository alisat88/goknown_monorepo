/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import User from '@modules/users/infra/typeorm/entities/User';
import ICreateRoomDTO from '../dtos/ICreateRoomDTO';
import Room from '../infra/typeorm/entities/Room';

export default interface IRoomsRepository {
  findBySyncId(sync_id: string): Promise<Room | undefined>;
  findAllMembers(sync_id: string): Promise<User[]>;
  create(data: ICreateRoomDTO): Promise<Room>;
  save(data: Room): Promise<Room>;
}
