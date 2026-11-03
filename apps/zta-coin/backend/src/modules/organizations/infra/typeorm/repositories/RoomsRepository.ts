/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateRoomDTO from '@modules/organizations/dtos/ICreateRoomDTO';
import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';
import User from '@modules/users/infra/typeorm/entities/User';
import { getRepository, Repository } from 'typeorm';
import Room from '../entities/Room';

class RoomsRepository implements IRoomsRepository {
  private ormRepository: Repository<Room>;

  constructor() {
    this.ormRepository = getRepository(Room);
  }

  public async findBySyncId(sync_id: string): Promise<Room | undefined> {
    const room = this.ormRepository.findOne({
      where: { sync_id },
      relations: [
        'admin',
        'dls',
        'members',
        'members.user',
        'group',
        'group.organization',
        'group.admin',
      ],
    });

    return room;
  }

  public async findAllMembers(sync_id: string): Promise<User[]> {
    const room = await this.ormRepository.findOne({
      where: { sync_id },
      relations: ['members', 'members.user'],
    });

    if (!room) {
      return [];
    }
    if (!room.members) {
      return [];
    }

    const user = room.members.map(member => member.user);

    return user;
  }

  public async create({
    admin_id,
    group_id,
    name,
    sync_id,
    dls,
  }: ICreateRoomDTO): Promise<Room> {
    const room = this.ormRepository.create({
      name,
      admin_id,
      group_id,
      sync_id,
      dls,
    });

    // verify if exists user to share folder
    // if (room.dls) {
    //   room.dls = dls;
    // }
    await this.ormRepository.save(room);

    return room;
  }

  public async save(data: Room): Promise<Room> {
    return await this.ormRepository.save(data);
  }
}

export default RoomsRepository;
