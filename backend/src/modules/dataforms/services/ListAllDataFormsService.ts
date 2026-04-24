import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import DataForm from '../infra/typeorm/entities/DataForm';
import IDataFormsRepository from '../repositories/IDataFormsRepository';

@injectable()
class ListAllDataFormsService {
  constructor(
    @inject('DataFormsRepository')
    private dataFormsRepository: IDataFormsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(user_syncid: string): Promise<DataForm[]> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }
    // TODO: FIND FOLDERS SHARE WITH ME
    const userGroupsForms = await this.usersRepository.findAllGroupsForms(
      user.id,
    );

    const noSharedGroups = await this.dataFormsRepository.findAll(user.id);

    // get only group folder
    const groupDataForms: DataForm[] = [] as DataForm[];
    if (userGroupsForms) {
      userGroupsForms.groups.map(group =>
        group.forms.map(dataForm =>
          groupDataForms.push({
            ...dataForm,
            shared_groups: dataForm.shared_groups,
          }),
        ),
      );
    }

    const allDataForms = [...noSharedGroups, ...groupDataForms];

    return allDataForms.filter(
      (dataForm, index, nextDataForm) =>
        nextDataForm.findIndex(d => d.sync_id === dataForm.sync_id) === index,
    );
  }
}

export default ListAllDataFormsService;
