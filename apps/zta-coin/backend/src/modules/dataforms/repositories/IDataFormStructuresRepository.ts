import ICreateDataFormStructures from '../dtos/ICreateDataFormStructures';
import DataFormStructure from '../infra/typeorm/entities/DataFormStructure';

export default interface IDataFormStructuresRepository {
  findBySyncId(sync_id: string): Promise<DataFormStructure | undefined>;
  findByDataFormId(form_id: string): Promise<DataFormStructure | undefined>;
  create(data: ICreateDataFormStructures): Promise<DataFormStructure>;
  save(dataform: DataFormStructure): Promise<DataFormStructure>;
}
