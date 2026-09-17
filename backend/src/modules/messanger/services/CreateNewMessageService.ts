import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';
import Message from '../infra/typeorm/entities/Message';
import IMessagesRepository from '../repositories/IMessagesRepository';

interface IRequestDTO {
  conversation_syncid: string;
  sender: string;
  text: string;
}

@injectable()
class CreateNewMessageService {
  constructor(
    @inject('ConversationsRepository')
    private conversationsRepository: IConversationsRepository,

    @inject('MessagesRepository')
    private messagesRepository: IMessagesRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    conversation_syncid,
    sender,
    text,
  }: IRequestDTO): Promise<Message> {
    // check if conversation exits
    // const conversation = await this.conversationsRepository.findById(
    //   conversation_id,
    // );
    const conversation = await this.conversationsRepository.findBySyncId(
      conversation_syncid,
    );

    if (!conversation) {
      throw new AppError('Conversation access denied', 403);
    }

    const senderUser = await this.usersRepository.findBySyncId(sender);

    if (!senderUser) {
      throw new AppError('User not found');
    }

    const senderIsMember = conversation.members.find(
      member => member === senderUser.sync_id,
    );

    if (!senderIsMember) {
      throw new AppError('Conversation access denied', 403);
    }

    if (typeof text !== 'string' || !text.trim() || text.length > 10000) {
      throw new AppError('Message must contain 1 to 10000 characters');
    }

    const message = await this.messagesRepository.create({
      conversation_syncid,
      sender,
      text,
    });

    return message;
  }
}

export default CreateNewMessageService;
