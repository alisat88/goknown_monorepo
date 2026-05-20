import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IStorageProvider from '@shared/container/providers/StorageProvider/models/IStorageProvider';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Organization from '../infra/typeorm/entities/Organization';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';

interface IRequest {
  user_syncid: string;
  sync_id: string;
  avatarFilename: string;
  master_node: boolean;
}

@injectable()
class UpdateOrganizationAvatarService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('StorageProvider')
    private storageProvider: IStorageProvider,
  ) {}

  public async execute({
    avatarFilename,
    sync_id,
    user_syncid,
    master_node,
  }: IRequest): Promise<Organization> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization by sync_id
    const organization = await this.organizationsRepository.findBySyncId(
      sync_id,
    );

    if (!organization) {
      throw new AppError('Organization not found');
    }

    // verify user permissions
    if (organization.owner_id !== user.id) {
      throw new AppError(`Only owner can update this organization`);
    }

    organization.avatar = avatarFilename;
    console.log('master_node', master_node);
    if (master_node) {
      const fileStorage = await this.storageProvider.saveFile(
        avatarFilename,
        'organizations',
      );
      if (!fileStorage) {
        throw new AppError('Error on upload file');
      }
    }

    await this.organizationsRepository.save(organization);

    return organization;
  }
}

export default UpdateOrganizationAvatarService;
