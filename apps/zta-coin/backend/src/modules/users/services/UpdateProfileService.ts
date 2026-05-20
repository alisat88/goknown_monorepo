import { injectable, inject } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import User, { EnumStatus } from '../infra/typeorm/entities/User';

import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';

interface IRequestDTO {
  user_id: string;
  name: string;
  phone?: string;
  old_password?: string;
  password?: string;
}

@injectable()
class UpdateProfileService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('HashProvider')
    private hashProvider: IHashProvider,
  ) {}

  public async execute({
    user_id,
    name,
    old_password,
    password,
    phone = '',
  }: IRequestDTO): Promise<User> {
    const user = await this.usersRepository.findBySyncId(user_id);

    if (!user) {
      throw new AppError('User not found');
    }

    if (user.status === EnumStatus.Inactive) {
      throw new AppError('Unauthorized');
    }

    // const userWithUpdatedEmail = await this.usersRepository.findByEmail(email);

    // if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user_id) {
    //   throw new AppError('E-mail already in use');
    // }

    user.name = name;
    user.status = EnumStatus.Active;
    // user.email = email.toLocaleLowerCase();

    if (password && !old_password) {
      throw new AppError(
        'You need to inform the old password to set a new password',
      );
    }

    if (password && old_password) {
      const checkOldPassword = await this.hashProvider.compareHash(
        old_password,
        user.password,
      );

      if (!checkOldPassword) {
        throw new AppError('Old password does not match.');
      }
      console.log('AEEEEE');
      user.password = await this.hashProvider.generateHash(password);
    }

    if (phone) {
      user.phone = phone;
    }

    return this.usersRepository.save(user);
  }
}

export default UpdateProfileService;
