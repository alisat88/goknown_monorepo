import IDataFormRecordsRepository from '@modules/dataforms/repositories/IDataFormRecordsRepository';
import ICreateDataFormRecords from '@modules/dataforms/dtos/ICreateDataFormRecords';
import { getRepository, Repository } from 'typeorm';
import DataFormRecord from '../entities/DataFormRecord';

export default class DataFormRecordsRepository
  implements IDataFormRecordsRepository
{
  private ormRepository: Repository<DataFormRecord>;

  constructor() {
    this.ormRepository = getRepository(DataFormRecord);
  }

  public async findByDataFormId(form_id: string): Promise<DataFormRecord[]> {
    const dataFormRecords = await this.ormRepository.find({
      where: { form_id },
      relations: ['dataform'],
    });

    return dataFormRecords;
  }

  public async findBySyncId(
    sync_id: string,
  ): Promise<DataFormRecord | undefined> {
    const dataform = this.ormRepository.findOne({
      where: { sync_id },
    });
    return dataform;
  }

  public async create(
    dataFormRecord: ICreateDataFormRecords,
  ): Promise<DataFormRecord> {
    const dataForm = this.ormRepository.create({
      ...dataFormRecord,
      value_json: dataFormRecord.value_json,
    });

    await this.ormRepository.save(dataForm);

    return dataForm;
  }

  public async save(dataFormRecord: DataFormRecord): Promise<DataFormRecord> {
    return await this.ormRepository.save(dataFormRecord);
  }
}
