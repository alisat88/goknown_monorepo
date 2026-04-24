import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import DataForm from '../infra/typeorm/entities/DataForm';

import IDataFormsRepository from '../repositories/IDataFormsRepository';

interface IRequestDTO {
  user_syncid: string;
  sync_id: string;
}

@injectable()
class FindDataFormsService {
  constructor(
    @inject('DataFormsRepository')
    private dataFormsRepository: IDataFormsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    user_syncid,
    sync_id,
  }: IRequestDTO): Promise<DataForm> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const dataForm = await this.dataFormsRepository.findBySyncId(sync_id);
    if (!dataForm) {
      throw new AppError('DataForm structure not found');
    }

    return dataForm;
  }
}

export default FindDataFormsService;
