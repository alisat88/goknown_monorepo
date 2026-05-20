import IGroupsRepository from '@modules/groups/repositories/IGroupsRepository';
import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';
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
  room_syncid?: string;
  shared_groups_ids?: string[];
  sync_id: string;
}

@injectable()
class CreateDataFormsService {
  constructor(
    @inject('DataFormsRepository')
    private dataFormsRepository: IDataFormsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,

    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute({
    name,
    user_syncid,
    description = '',
    privacy,
    room_syncid,
    shared_groups_ids = [],
    sync_id,
  }: IRequestDTO): Promise<DataForm> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    let shared_groups;
    if (!!shared_groups_ids && shared_groups_ids.length > 0) {
      shared_groups = await this.groupsRepository.findAll({
        sync_ids: [...shared_groups_ids],
      });
    }

    let room_id;
    if (room_syncid) {
      const room = await this.organizationsRoomsRepository.findBySyncId(
        room_syncid,
      );
      if (room) {
        room_id = room.id;
      }
    }

    const dataForm = await this.dataFormsRepository.create({
      name,
      owner_id: user.id,
      shared_groups,
      sync_id,
      room_id,
      description,
      privacy,
    });

    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'create',
      dapp: 'DataForm',
      sync_id: sync_id,
      user_sync_id: user.sync_id,
      dapp_token: dataForm.id,
      dapp_token_sync_id: sync_id,
      outcome: 'success',
      message: dataForm,
    });

    return dataForm;
  }
}

export default CreateDataFormsService;
