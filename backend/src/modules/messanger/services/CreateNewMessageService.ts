import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';
import Message from '../infra/typeorm/schemas/Message';
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
      throw new AppError('Conversation not started');
    }

    const senderUser = await this.usersRepository.findBySyncId(sender);

    if (!senderUser) {
      throw new AppError('User not found');
    }

    const senderIsMember = conversation.members.find(
      member => member === senderUser.sync_id,
    );

    if (!senderIsMember) {
      throw new AppError('not permited');
    }

    // console.log('AQUI===================');

    const message = await this.messagesRepository.create({
      conversation_syncid,
      sender,
      text,
    });

    const conversationMemberIndex = conversation.members.findIndex(
      member => member === sender,
    );

    // update new conversation
    conversation.unread = conversation.unread.map((value, index) =>
      conversationMemberIndex !== index ? value : value === 0 ? 1 : value + 1,
    );

    await this.conversationsRepository.save(conversation);
    return message;
  }
}

export default CreateNewMessageService;
