import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';

@injectable()
class ListAllOrganizationsService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
  ) {}

  public async execute(user_syncid: string): Promise<any> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const organizationsUsers =
      await this.organizationsUsersRepository.findAllOrganizationsByUser(
        user.id,
      );

    return organizationsUsers;
  }
}

export default ListAllOrganizationsService;
