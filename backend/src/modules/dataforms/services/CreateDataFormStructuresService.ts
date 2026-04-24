import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import DataFormStructure from '../infra/typeorm/entities/DataFormStructure';

import IDataFormStructuresRepository from '../repositories/IDataFormStructuresRepository';
import IDataFormsRepository from '../repositories/IDataFormsRepository';

interface IRequestDTO {
  user_syncid: string;
  sync_id: string;
  form_syncid: string;
  value_json: string;
}

@injectable()
class CreateDataFormStructuresService {
  constructor(
    @inject('DataFormStructuresRepository')
    private dataFormStructuresRepository: IDataFormStructuresRepository,

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
  }: IRequestDTO): Promise<DataFormStructure> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const dataForm = await this.dataFormsRepository.findBySyncId(form_syncid);

    if (!dataForm) {
      throw new AppError('DataForm not found');
    }

    if (dataForm.owner.sync_id !== user_syncid) {
      throw new AppError(`Only owner can create form structure`);
    }

    // check if dataForm have structure
    const haveDataFormStructure =
      await this.dataFormStructuresRepository.findByDataFormId(dataForm.id);
    if (haveDataFormStructure) {
      throw new AppError(`Data Form already has data form structure`);
    }

    // create data form
    const dataFormStructure = await this.dataFormStructuresRepository.create({
      owner_id: user.id,
      sync_id,
      form_id: dataForm.id,
      value_json,
    });

    return dataFormStructure;
  }
}

export default CreateDataFormStructuresService;
