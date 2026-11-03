/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateDataFormStructures from '../dtos/ICreateDataFormStructures';
import DataFormStructure from '../infra/typeorm/entities/DataFormStructure';

export default interface IDataFormStructuresRepository {
  findBySyncId(sync_id: string): Promise<DataFormStructure | undefined>;
  findByDataFormId(form_id: string): Promise<DataFormStructure | undefined>;
  create(data: ICreateDataFormStructures): Promise<DataFormStructure>;
  save(dataform: DataFormStructure): Promise<DataFormStructure>;
}
