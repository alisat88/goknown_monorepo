import { injectable, inject } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import User from '../infra/typeorm/entities/User';

import IUsersRepository from '../repositories/IUsersRepository';
import IStorageProvider from '@shared/container/providers/StorageProvider/models/IStorageProvider';

interface IRequestDTO {
  sync_user_id: string;
  phone?: string;
  twoFactorAuthenticationCode: string;
}

@injectable()
class UpdateUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('StorageProvider')
    private storageProvider: IStorageProvider,
  ) {}

  public async execute({
    sync_user_id,
    phone = '',
    twoFactorAuthenticationCode,
  }: IRequestDTO): Promise<User> {
    const user = await this.usersRepository.findBySyncId(sync_user_id);
    if (!user) {
      throw new AppError('Only authenticated users can change avatar.', 401);
    }

    if (!user.twoFactorAuthenticationCode) {
      user.twoFactorAuthenticationCode = twoFactorAuthenticationCode;
    }

    if (phone) {
      user.phone = phone;
    }

    await this.usersRepository.save(user);

    return user;
  }
}

export default UpdateUserService;
