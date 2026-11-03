/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IConfigsRepository from '@modules/configs/repositories/IConfigsRepository';
import { getRepository, Repository } from 'typeorm';
import Config from '../entities/Config';

export default class ConfigsRepository implements IConfigsRepository {
  private ormRepository: Repository<Config>;

  constructor() {
    this.ormRepository = getRepository(Config);
  }

  public async findLast(): Promise<Config | undefined> {
    const config = await this.ormRepository.findOne();
    return config;
  }
}
