import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';
import Conversation from '../infra/typeorm/entities/Conversation';

interface IRequestDTO {
  usersync_id: string;
  receiver_id: string;
}

@injectable()
class FindConversationsService {
  constructor(
    @inject('ConversationsRepository')
    private conversationsRepository: IConversationsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    usersync_id,
    receiver_id,
  }: IRequestDTO): Promise<Conversation | undefined> {
    const user = await this.usersRepository.findBySyncId(usersync_id);

    if (!user) {
      throw new AppError('User not found');
    }
    // console.log('AEEEEEEEEE');
    const conversation = await this.conversationsRepository.findAll([
      usersync_id,
      receiver_id,
    ]);
    return conversation.find(
      item => item.type !== 'group' && item.members.length === 2,
    );
  }
}

export default FindConversationsService;
