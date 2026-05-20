import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';

import { container, inject, injectable } from 'tsyringe';
import DigitalAsset, {
  EnumPrivacy,
} from '../infra/typeorm/entities/DigitalAsset';
import AppError from '@shared/errors/AppError';
import IFoldersRepository from '../repositories/IFoldersRepository';
import IAuditLogsRepository from '@modules/auditlogs/repositories/IAuditLogsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

interface IRequestDTO {
  sync_id: string;
  user_id: string;
  description?: string;
  folder_sync_id: string;
  privacy: EnumPrivacy;
}

@injectable()
class UpdateUserDigitalAssetsService {
  constructor(
    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('FoldersRepository')
    private foldersRepository: IFoldersRepository,
  ) {}

  public async execute({
    sync_id,
    description,
    privacy,
    user_id,
    folder_sync_id,
  }: IRequestDTO): Promise<DigitalAsset | undefined> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    const digitalAssets = await this.digitalAssetsRepository.findBySyncId(
      sync_id,
    );

    if (!digitalAssets) {
      throw new AppError('Digital Assets not found');
    }

    if (digitalAssets.user_id !== user.id) {
      throw new AppError('Forbidden', 403);
    }

    // find by sync folder id
    const folder = await this.foldersRepository.findBySyncId(folder_sync_id);
    if (!folder) {
      throw new AppError('Folder not found');
    }

    digitalAssets.privacy = privacy;
    digitalAssets.description = description || '';
    digitalAssets.folder = folder;

    await this.digitalAssetsRepository.save(digitalAssets);

    // Create Audit Log
    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'update',
      dapp: 'DigitalAssets',
      sync_id: digitalAssets.sync_id,
      user_sync_id: user.sync_id,
      dapp_token: digitalAssets.id,
      dapp_token_sync_id: digitalAssets.sync_id,
      outcome: 'success',
      message: digitalAssets,
    });

    return digitalAssets;
  }
}

export default UpdateUserDigitalAssetsService;
