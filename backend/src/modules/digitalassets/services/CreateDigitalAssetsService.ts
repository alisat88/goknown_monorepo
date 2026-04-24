import { injectable, inject, container } from 'tsyringe';
import mime from 'mime';
import { v4 } from 'uuid';
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';

import IStorageProvider from '@shared/container/providers/StorageProvider/models/IStorageProvider';
import IChecksumProvider from '../providers/ChecksumProvider/models/IChecksumProvider';
import AppError from '@shared/errors/AppError';
import DigitalAsset, {
  EnumPrivacy,
} from '../infra/typeorm/entities/DigitalAsset';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IFoldersRepository from '../repositories/IFoldersRepository';
import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';
import IAuditLogsRepository from '@modules/auditlogs/repositories/IAuditLogsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

interface IRequestDTO {
  filename: string;
  name: string;
  user_id: string;
  description?: string;
  sync_id: string;
  folder_sync_id: string;
  master_node: boolean;
  mimeType?: string;
  filetoken?: string;
  room_syncid?: string;
  privacy: EnumPrivacy;
}

@injectable()
class CreateDigitalAssetsService {
  constructor(
    @inject('StorageProvider')
    private storageProvider: IStorageProvider,

    @inject('ChecksumProvider')
    private checksumProvider: IChecksumProvider,

    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,

    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute({
    filename,
    name,
    description,
    user_id,
    master_node = true,
    sync_id,
    mimeType = '',
    privacy,
    filetoken = '',
    room_syncid = v4(),
    folder_sync_id,
  }: IRequestDTO): Promise<DigitalAsset> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    let fileToken = filetoken;
    if (master_node) {
      fileToken = await this.checksumProvider.generate({ filename });
    }

    const existsFileToken = await this.digitalAssetsRepository.findByToken(
      fileToken,
    );

    if (existsFileToken) {
      throw new AppError('This file has already been uploaded');
    }

    // find by sync folder id
    const folder = await this.foldersRepository.findBySyncId(folder_sync_id);
    if (!folder) {
      throw new AppError('Folder not found');
    }

    // upload file only master node
    // if (master_node) {
    // verify if file token exists
    if (master_node) {
      const fileStorage = await this.storageProvider.saveFile(filename, 'nfts');
      if (!fileStorage) {
        throw new AppError('Error on upload file');
      }
    }

    let room_id = null;

    if (
      room_syncid &&
      room_syncid !== undefined &&
      room_syncid !== 'undefined' &&
      room_syncid !== null &&
      room_syncid.toString() !== "''"
    ) {
      // console.log('AQUIIII', room_syncid);

      const room = await this.organizationsRoomsRepository.findBySyncId(
        room_syncid,
      );
      if (room) {
        room_id = room.id;
      }
    }

    const digitalAsset = await this.digitalAssetsRepository.create({
      name,
      description,
      user_id: user.id,
      token: fileToken,
      privacy,
      folder_id: folder.id,
      shared: !!folder.shared_users && folder.shared_users.length > 0,
      sync_id,
      mimetype: master_node ? mime.getType(filename) || '' : mimeType,
      filename,
      room_id,
    });

    // Create Audit Log
    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'create',
      dapp: 'DigitalAssets',
      sync_id: digitalAsset.sync_id,
      user_sync_id: user.sync_id,
      dapp_token: digitalAsset.id,
      dapp_token_sync_id: digitalAsset.sync_id,
      message: digitalAsset,
      outcome: 'success',
    });

    return digitalAsset;
  }
}

export default CreateDigitalAssetsService;
