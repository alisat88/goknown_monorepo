import ICreateDataFormRecords from '../dtos/ICreateDataFormRecords';
import DataFormRecord from '../infra/typeorm/entities/DataFormRecord';

export default interface IDataFormRecordsRepository {
  findBySyncId(sync_id: string): Promise<DataFormRecord | undefined>;
  findByDataFormId(form_id: string): Promise<DataFormRecord[]>;
  create(data: ICreateDataFormRecords): Promise<DataFormRecord>;
  save(dataform: DataFormRecord): Promise<DataFormRecord>;
}
