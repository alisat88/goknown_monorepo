import IGroupsRepository from '@modules/groups/repositories/IGroupsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import DataForm, { EnumPrivacy } from '../infra/typeorm/entities/DataForm';

import IDataFormsRepository from '../repositories/IDataFormsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

interface IRequestDTO {
  name: string;
  user_syncid: string;
  description?: string;
  privacy?: EnumPrivacy;
  shared_groups_ids?: string[];
  dataform_syncid: string;
}

@injectable()
class UpdateDataFormService {
  constructor(
    @inject('DataFormsRepository')
    private dataFormsRepository: IDataFormsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,
  ) {}

  public async execute({
    name,
    user_syncid,
    description = '',
    privacy,
    shared_groups_ids = [],
    dataform_syncid,
  }: IRequestDTO): Promise<DataForm> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const dataForm = await this.dataFormsRepository.findBySyncId(
      dataform_syncid,
    );
    if (!dataForm) {
      throw new AppError('DataForm structure not found');
    }

    if (dataForm.owner.sync_id !== user_syncid) {
      throw new AppError(`Only owner can create form structure`);
    }

    if (!!shared_groups_ids && shared_groups_ids.length > 0) {
      dataForm.shared_groups = await this.groupsRepository.findAll({
        sync_ids: [...shared_groups_ids],
      });
    } else {
      dataForm.shared_groups = [];
    }

    dataForm.name = name;
    dataForm.description = description;
    dataForm.privacy = privacy || dataForm.privacy;

    this.dataFormsRepository.save(dataForm);

    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'update',
      dapp: 'DataForm',
      sync_id: dataForm.sync_id,
      user_sync_id: user.sync_id,
      dapp_token: dataForm.id,
      dapp_token_sync_id: dataForm.sync_id,
      outcome: 'success',
      message: dataForm,
    });

    return dataForm;
  }
}

export default UpdateDataFormService;
