/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IDLsRepository from '@modules/dls/repositories/IDLsRepository';
import { getRepository, In, Repository } from 'typeorm';
import DL from '../entities/DL';

class DLsRepository implements IDLsRepository {
  private ormRepository: Repository<DL>;

  constructor() {
    this.ormRepository = getRepository(DL);
  }

  public async findAllBySyncId(dls_syncid: string[]): Promise<DL[]> {
    if (dls_syncid.length === 0) {
      return [];
    }
    // console.log(dls_syncid);
    const dls = this.ormRepository.find({
      where: { sync_id: In([...dls_syncid]) },
    });

    return dls;
  }

  public async findAll(): Promise<DL[]> {
    const dls = this.ormRepository.find();

    return dls;
  }
}

export default DLsRepository;
