import { inject, injectable } from 'tsyringe';
import IUpdateUserDTO from '../dtos/IUpdateUserDTO';
import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import User from '@modules/users/infra/typeorm/entities/User';

type IRequestDTO = IUpdateUserDTO & {
  sync_user_id: string;
  logged_user_id: string;
};

@injectable()
class UpdateUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    // email,
    name,
    role,
    status,
    sync_user_id,
  }: IRequestDTO): Promise<User> {
    const user = await this.usersRepository.findBySyncId(sync_user_id);

    if (!user) {
      throw new AppError('User not found');
    }

    // if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;

    await this.usersRepository.save(user);

    return user;
  }
}

export default UpdateUserService;
