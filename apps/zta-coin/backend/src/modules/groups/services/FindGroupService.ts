import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group from '../infra/typeorm/entities/Group';
import IGroupsRepository from '../repositories/IGroupsRepository';

@injectable()
class FindGroupService {
  constructor(
    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(
    user_syncid: string,
    group_syncid: string,
  ): Promise<Group | undefined> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // TODO: verify if I can see this folder
    const group = await this.groupsRepository.findBySyncId(group_syncid);

    return group;
  }
}

export default FindGroupService;
