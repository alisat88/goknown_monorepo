import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';

import IDataFormStructuresRepository from '../repositories/IDataFormStructuresRepository';
import IDataFormsRepository from '../repositories/IDataFormsRepository';
import IDataFormRecordsRepository from '../repositories/IDataFormRecordsRepository';
import DataFormRecord from '../infra/typeorm/entities/DataFormRecord';

interface IRequestDTO {
  user_syncid: string;
  sync_id: string;
  form_syncid: string;
  value_json: string;
}

@injectable()
class CreateDataFormRecordsService {
  constructor(
    @inject('DataFormStructuresRepository')
    private dataFormStructuresRepository: IDataFormStructuresRepository,

    @inject('DataFormRecordsRepository')
    private dataFormRecordsRepository: IDataFormRecordsRepository,

    @inject('DataFormsRepository')
    private dataFormsRepository: IDataFormsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    user_syncid,
    sync_id,
    form_syncid,
    value_json,
  }: IRequestDTO): Promise<DataFormRecord> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const dataForm = await this.dataFormsRepository.findBySyncId(form_syncid);

    if (!dataForm) {
      throw new AppError('DataForm not found');
    }

    // create new data form
    const dataFormRecord = await this.dataFormRecordsRepository.create({
      sync_id,
      form_id: dataForm.id,
      value_json,
    });

    return dataFormRecord;
  }
}

export default CreateDataFormRecordsService;
