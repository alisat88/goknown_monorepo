import IGroupsRepository from '@modules/groups/repositories/IGroupsRepository';
import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import Folder from '../infra/typeorm/entities/Folder';
import IFoldersRepository from '../repositories/IFoldersRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

interface IRequestDTO {
  name: string;
  user_syncid: string;
  shared_users_ids?: string[];
  shared_groups_ids?: string[];
  sync_id: string;
  room_syncid?: string;
  editable?: boolean;
  welcome?: boolean;
}

@injectable()
class CreateFolderService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

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
    shared_groups_ids = [],
    shared_users_ids = [],
    sync_id,
    editable,
    room_syncid,
    welcome = false,
  }: IRequestDTO): Promise<Folder> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }
    // console.log(welcome);
    if (welcome !== undefined && welcome !== false) {
      if (user.role !== 'admin') {
        throw new AppError(`Only admin can change welcome folder`);
      }

      const hasWelcomeFolder = await this.foldersRepository.findWelcomeFolder();

      if (hasWelcomeFolder) {
        throw new AppError('Welcome folder already exists');
      }
    }

    const shared_users = await this.usersRepository.findAll({
      sync_ids: [...shared_users_ids, user_syncid],
    });
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

    const folder = await this.foldersRepository.create({
      name,
      welcome,
      owner_id: user.id,
      shared_users: welcome ? [] : shared_users,
      shared_groups: welcome ? [] : shared_groups,
      sync_id,
      editable,
      room_id,
    });

    // Create Audit Log
    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'create',
      dapp: 'Folder',
      sync_id: folder.sync_id,
      user_sync_id: user.sync_id,
      dapp_token: folder.id,
      dapp_token_sync_id: folder.sync_id,
      outcome: 'success',
      message: folder,
    });

    return folder;
  }
}

export default CreateFolderService;
