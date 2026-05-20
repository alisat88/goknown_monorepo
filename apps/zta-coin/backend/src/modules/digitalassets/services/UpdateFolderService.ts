import IGroupsRepository from '@modules/groups/repositories/IGroupsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';
import Folder from '../infra/typeorm/entities/Folder';
import IFoldersRepository from '../repositories/IFoldersRepository';
import IAuditLogsRepository from '@modules/auditlogs/repositories/IAuditLogsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

interface IRequestDTO {
  name: string;
  user_syncid: string;
  shared_users_ids?: string[] | undefined;
  shared_groups_ids?: string[] | undefined;
  folder_syncid: string;
  welcome?: boolean;
}

@injectable()
class UpdateFolderService {
  constructor(
    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,
  ) {}

  public async execute({
    name,
    user_syncid,
    folder_syncid,
    shared_groups_ids = [],
    shared_users_ids = [],
    welcome,
  }: IRequestDTO): Promise<Folder> {
    const user = await this.usersRepository.findBySyncId(user_syncid);

    if (!user) {
      throw new AppError('User not found');
    }

    // TODO: verify if I can share this folder
    const folder = await this.foldersRepository.findBySyncId(folder_syncid);

    if (!folder) {
      throw new AppError('Folder not found');
    }

    if (!folder.editable) {
      throw new AppError(`You can't edit this folder`);
    }

    if (user.role !== 'admin' && folder.owner_id !== user.id) {
      throw new AppError(`Only owner can edit this folder`);
    }

    if (welcome !== undefined && welcome !== false) {
      if (user.role !== 'admin') {
        throw new AppError(`Only admin can change welcome folder`);
      }

      const hasWelcomeFolder = await this.foldersRepository.findWelcomeFolder();

      if (hasWelcomeFolder && hasWelcomeFolder.sync_id !== folder_syncid) {
        throw new AppError('Welcome folder already exists');
      }
    }

    // shared folder with users
    // if (!!shared_users_ids && shared_users_ids.length > 0) {
    folder.shared_users = await this.usersRepository.findAll({
      sync_ids: [...shared_users_ids, user_syncid],
    });
    // }

    // shared folder with groups
    if (!!shared_groups_ids && shared_groups_ids.length > 0) {
      folder.shared_groups = await this.groupsRepository.findAll({
        sync_ids: shared_groups_ids,
      });
    } else {
      folder.shared_groups = [];
    }

    folder.name = name;
    folder.welcome = welcome || false;

    if (welcome) {
      delete folder.shared_groups;
      delete folder.shared_users;
    }

    this.foldersRepository.save(folder);

    // Create Audit Log
    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'update',
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

export default UpdateFolderService;
