import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group from '../infra/typeorm/entities/Group';
import IGroupsRepository from '../repositories/IGroupsRepository';

interface IRequestDTO {
  name: string;
  user_syncid: string;
  shared_users_ids?: string[];
  sync_id: string;
  description?: string;
}

@injectable()
class CreateGroupService {
  constructor(
    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    name,
    user_syncid,
    description,
    shared_users_ids = [],
    sync_id,
  }: IRequestDTO): Promise<Group> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    const shared_users = await this.usersRepository.findAll({
      sync_ids: [...shared_users_ids, user_syncid],
    });

    const group = await this.groupsRepository.create({
      name,
      owner_id: user.id,
      shared_users,
      sync_id,
      description,
    });

    return group;
  }
}

export default CreateGroupService;
