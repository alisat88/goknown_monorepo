import IDataFormsRepository from '@modules/dataforms/repositories/IDataFormsRepository';
import ICreateDataFormsDTO from '@modules/dataforms/dtos/ICreateDataFormsDTO';
import { getRepository, Repository } from 'typeorm';
import DataForm from '../entities/DataForm';

export default class DataFormsRepository implements IDataFormsRepository {
  private ormRepository: Repository<DataForm>;

  constructor() {
    this.ormRepository = getRepository(DataForm);
  }

  public async findBySyncId(sync_id: string): Promise<DataForm | undefined> {
    const dataform = this.ormRepository.findOne({
      where: { sync_id },
      relations: ['shared_groups', 'owner'],
    });
    return dataform;
  }

  public async findAll(owner_id: string): Promise<DataForm[]> {
    const folders = this.ormRepository.find({
      where: { owner_id, room_id: null },
      relations: ['shared_groups', 'owner'],
    });
    return folders;
  }

  public async findAllByRoomId(room_id: string): Promise<DataForm[]> {
    const dataforms = this.ormRepository.find({
      where: { room_id },
      relations: ['owner'],
    });

    return dataforms;
  }

  public async create(dataFormData: ICreateDataFormsDTO): Promise<DataForm> {
    const dataForm = this.ormRepository.create({
      name: dataFormData.name,
      description: dataFormData.description,
      privacy: dataFormData.privacy,
      owner_id: dataFormData.owner_id,
      sync_id: dataFormData.sync_id,
      room_id: dataFormData.room_id,
      shared_groups: dataFormData.shared_groups,
    });

    await this.ormRepository.save(dataForm);

    return dataForm;
  }

  public async save(dataForm: DataForm): Promise<DataForm> {
    return await this.ormRepository.save(dataForm);
  }

  public async destroy(dataForm: DataForm): Promise<void> {
    await this.ormRepository.remove(dataForm);
  }
}
