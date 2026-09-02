import { injectable, inject } from 'tsyringe';

import User, { EnumStatus } from '../infra/typeorm/entities/User';
import IUsersRepository from '../repositories/IUsersRepository';

interface IRequest {
  name: string;
  limit?: number;
}

export interface IShareParticipant {
  id: string;
  sync_id: string;
  name: string;
  avatar_url: string | null;
}

@injectable()
class ListShareParticipantsService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    name,
    limit = 30,
  }: IRequest): Promise<IShareParticipant[]> {
    const normalizedName = name.trim();

    if (normalizedName.length < 3) {
      return [];
    }

    const users = await this.usersRepository.findAll({
      status: [EnumStatus.Active],
      name: normalizedName,
      limit,
      offset: 0,
    });

    return (users || []).map((user: User) => ({
      id: user.id,
      sync_id: user.sync_id,
      name: user.name,
      avatar_url: user.getAvatarUrl(),
    }));
  }
}

export default ListShareParticipantsService;
