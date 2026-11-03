/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateDataFormRecords from '../dtos/ICreateDataFormRecords';
import DataFormRecord from '../infra/typeorm/entities/DataFormRecord';

export default interface IDataFormRecordsRepository {
  findBySyncId(sync_id: string): Promise<DataFormRecord | undefined>;
  findByDataFormId(form_id: string): Promise<DataFormRecord[]>;
  create(data: ICreateDataFormRecords): Promise<DataFormRecord>;
  save(dataform: DataFormRecord): Promise<DataFormRecord>;
}
