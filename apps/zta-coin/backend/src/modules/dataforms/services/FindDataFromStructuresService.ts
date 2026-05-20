import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import DataFormStructure from '../infra/typeorm/entities/DataFormStructure';

import IDataFormStructuresRepository from '../repositories/IDataFormStructuresRepository';
import IDataFormsRepository from '../repositories/IDataFormsRepository';

interface IRequestDTO {
  user_syncid: string;
  form_syncid: string;
}

@injectable()
class FindDataFromStructuresService {
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
  }: IRequestDTO): Promise<DataFormStructure> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const dataForm = await this.dataFormsRepository.findBySyncId(form_syncid);

    if (!dataForm) {
      throw new AppError('DataForm not found');
    }

    // create dataform
    const dataFormStructure =
      await this.dataFormStructuresRepository.findByDataFormId(dataForm.id);

    if (!dataFormStructure) {
      // send no content to redirect page
      throw new AppError('DataForm structure not found', 204);
    }

    return dataFormStructure;
  }
}

export default FindDataFromStructuresService;
