import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';
import IMessagesRepository from '../repositories/IMessagesRepository';
import Message from '../infra/typeorm/schemas/Message';

interface IRequestDTO {
  usersync_id: string;
  conversation_syncid: string;
}

@injectable()
class ListAllUserMessagesService {
  constructor(
    @inject('ConversationsRepository')
    private conversationsRepository: IConversationsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('MessagesRepository')
    private messagesRepository: IMessagesRepository,
  ) {}

  public async execute({
    usersync_id,
    conversation_syncid,
  }: IRequestDTO): Promise<Message[]> {
    const conversation = await this.conversationsRepository.findBySyncId(
      conversation_syncid,
    );

    if (!conversation) {
      throw new AppError('Conversation not started');
    }

    const user = await this.usersRepository.findBySyncId(usersync_id);

    if (!user) {
      throw new AppError('User not found');
    }

    const messages = await this.messagesRepository.findAll(conversation_syncid);

    return messages;
  }
}

export default ListAllUserMessagesService;
