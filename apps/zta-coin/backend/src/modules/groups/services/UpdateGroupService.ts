import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Group from '../infra/typeorm/entities/Group';
import IGroupsRepository from '../repositories/IGroupsRepository';

interface IRequestDTO {
  name: string;
  user_syncid: string;
  shared_users_ids?: string[] | undefined;
  group_syncid: string;
  description?: string;
}

@injectable()
class UpdateGroupService {
  constructor(
    @inject('GroupsRepository')
    private groupsRepository: IGroupsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    name,
    user_syncid,
    group_syncid,
    shared_users_ids = undefined,
    description,
  }: IRequestDTO): Promise<Group> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // TODO: verify if I can share this folder
    const group = await this.groupsRepository.findBySyncId(group_syncid);

    if (!group) {
      throw new AppError('Group not found');
    }

    if (group.owner_id !== user.id) {
      throw new AppError(`Only owner can edit this group`);
    }

    if (shared_users_ids !== undefined) {
      // shared folder with users

      group.shared_users = await this.usersRepository.findAll({
        sync_ids: [...shared_users_ids, user_syncid],
      });
    }

    group.name = name;
    group.description = description;

    this.groupsRepository.save(group);

    return group;
  }
}

export default UpdateGroupService;
