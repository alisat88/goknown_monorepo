import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group from '../infra/typeorm/entities/Group';

@injectable()
class ListAllGroupsService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(
    user_syncid: string,
    groupName: string,
  ): Promise<Group[]> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const userGroups = await this.usersRepository.findAllGroups(
      user.id,
      groupName,
    );
    if (!userGroups) {
      return [];
    }
    return userGroups.groups;
  }
}

export default ListAllGroupsService;
