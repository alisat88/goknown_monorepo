/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateUserDTO from '../dtos/ICreateUserDTO';
import User, { EnumStatus } from '../infra/typeorm/entities/User';
export interface IFindAll {
  status?: EnumStatus[];
  name?: string;
  sync_ids?: string[];
  limit?: number;
  offset?: number;
}
export default interface IUsersRepository {
  findById(id: string): Promise<User | undefined>;
  findBySyncId(id: string): Promise<User | undefined>;
  findAll({
    status,
    name,
    sync_ids,
    limit,
  }: IFindAll): Promise<User[] | undefined>;
  findAllGroups(id: string, groupName?: string): Promise<User | undefined>;
  findAllGroupsForms(id: string, groupName?: string): Promise<User | undefined>;
  findAllFolders(id: string): Promise<User | undefined>;
  // findAllORganizations(id: string): Promise<User | undefined>;
  // findAllDataFroms(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(data: ICreateUserDTO): Promise<User>;
  save(user: User): Promise<User>;
  updateLoginCode(
    id: string,
    pin: string,
    pinCreatedAt: Date,
  ): Promise<void>;
}
