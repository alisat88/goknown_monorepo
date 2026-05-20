import IDataFormStructuresRepository from '@modules/dataforms/repositories/IDataFormStructuresRepository';
import ICreateDataFormStructures from '@modules/dataforms/dtos/ICreateDataFormStructures';
import { getRepository, Repository } from 'typeorm';
import DataFormStructure from '../entities/DataFormStructure';

export default class DataFormStructuresRepository
  implements IDataFormStructuresRepository
{
  private ormRepository: Repository<DataFormStructure>;

  constructor() {
    this.ormRepository = getRepository(DataFormStructure);
  }

  public async findByDataFormId(
    form_id: string,
  ): Promise<DataFormStructure | undefined> {
    const dataFormStructure = await this.ormRepository.findOne({
      where: { form_id },
      relations: ['dataform'],
    });

    return dataFormStructure;
  }

  public async findBySyncId(
    sync_id: string,
  ): Promise<DataFormStructure | undefined> {
    const dataform = this.ormRepository.findOne({
      where: { sync_id },
    });
    return dataform;
  }

  public async create(
    dataFormStructure: ICreateDataFormStructures,
  ): Promise<DataFormStructure> {
    const dataForm = this.ormRepository.create({
      ...dataFormStructure,
      value_json: dataFormStructure.value_json,
    });

    await this.ormRepository.save(dataForm);

    return dataForm;
  }

  public async save(
    dataFormStructure: DataFormStructure,
  ): Promise<DataFormStructure> {
    return await this.ormRepository.save(dataFormStructure);
  }
}
