/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { inject, injectable } from 'tsyringe';
import DL from '../infra/typeorm/entities/DL';
import IDLsRepository from '../repositories/IDLsRepository';

@injectable()
class ListAllDLsService {
  constructor(
    @inject('DLsRepository')
    private dlsRepository: IDLsRepository,
  ) {}

  public async execute(): Promise<DL[]> {
    const dls = await this.dlsRepository.findAll();

    return dls;
  }
}

export default ListAllDLsService;
