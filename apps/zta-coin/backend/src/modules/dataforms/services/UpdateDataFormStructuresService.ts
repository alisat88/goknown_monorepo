import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import DataFormStructure from '../infra/typeorm/entities/DataFormStructure';

import IDataFormStructuresRepository from '../repositories/IDataFormStructuresRepository';
import IDataFormsRepository from '../repositories/IDataFormsRepository';

interface IRequestDTO {
  user_syncid: string;
  form_syncid: string;
  value_json: string;
}

@injectable()
class UpdateDataFormStructuresService {
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
      if (dataForm.room_id)
        throw new AppError(
          `Only the data form creator can make changes to the form`,
        );

      throw new AppError(`Only owner can edit form structure`);
    }

    // check if dataForm have structure
    const dataFormStructure =
      await this.dataFormStructuresRepository.findByDataFormId(dataForm.id);
    if (!dataFormStructure) {
      throw new AppError('DataForm structure not found');
    }

    dataFormStructure.value_json = value_json;
    this.dataFormStructuresRepository.save(dataFormStructure);

    return dataFormStructure;
  }
}

export default UpdateDataFormStructuresService;
