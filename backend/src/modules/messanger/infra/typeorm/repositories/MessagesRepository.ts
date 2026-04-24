import { getRepository, Repository } from 'typeorm';
import { v4 } from 'uuid';

import ICreateMessageDTO from '@modules/messanger/dtos/ICreateMessageDTO';
// import Message from '../schemas/Message';
import Message from '../entities/Message';
import IMessagesRepository from '@modules/messanger/repositories/IMessagesRepository';
import Conversation from '../entities/Conversation';

class MessagesRepository implements IMessagesRepository {
  // private ormRepository: MongoRepository<Message>;
  private ormRepository: Repository<Conversation>;

  constructor() {
    // this.ormRepository = getMongoRepository(Message, 'mongo');
    this.ormRepository = getRepository(Conversation);
  }

  public async findAll(conversation_syncid: string): Promise<Message[]> {
    const conversations = await this.ormRepository.findOne({
      where: { sync_id: conversation_syncid },
    });

    if (conversations && conversations.messages) {
      return conversations.messages;
    }
    return [];
  }

  public async create(data: ICreateMessageDTO): Promise<Message | undefined> {
    const now = new Date().toISOString();
    const newMessage: Message = { id: v4(), created_at: now, ...data };

    const messagesJSON = JSON.stringify([newMessage]);
    await this.ormRepository
      .createQueryBuilder()
      .update(Conversation)
      .set({
        messages: () =>
          `messages || ARRAY(SELECT jsonb_array_elements_text('${messagesJSON}')::jsonb)`,
      })
      .where('sync_id = :sync_id', { sync_id: data.conversation_syncid })
      .execute();

    return newMessage;
  }
}

export default MessagesRepository;
