import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';

import IDataFormStructuresRepository from '../repositories/IDataFormStructuresRepository';
import IDataFormsRepository from '../repositories/IDataFormsRepository';
import IDataFormRecordsRepository from '../repositories/IDataFormRecordsRepository';

interface IRequestDTO {
  user_syncid: string;
  form_syncid: string;
}

@injectable()
class ListAllDataFormRecordsService {
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

  public async execute({ user_syncid, form_syncid }: IRequestDTO): Promise<{
    dataform: any;
    columns: any[];
    data: any[];
  }> {
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

    const records = await this.dataFormRecordsRepository.findByDataFormId(
      dataForm.id,
    );
    const columns = JSON.parse(dataFormStructure.value_json)
      .map((value: any) => ({ title: value.label, field: value.name }))
      .filter((value: any) => value.field !== null);
    const data: any[] = [];
    records.map((record: any) => data.push(JSON.parse(record.value_json)));

    return {
      dataform: {
        sync_id: dataForm.sync_id,
        id: dataForm.id,
        name: dataForm.name,
      },
      columns,
      data,
    };
  }
}

export default ListAllDataFormRecordsService;
