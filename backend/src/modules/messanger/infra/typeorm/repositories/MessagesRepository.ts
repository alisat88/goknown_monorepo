import { getRepository, Repository } from 'typeorm';
import { v4 } from 'uuid';
import AppError from '@shared/errors/AppError';
import ICreateMessageDTO from '@modules/messanger/dtos/ICreateMessageDTO';
import Message from '../entities/Message';
import IMessagesRepository from '@modules/messanger/repositories/IMessagesRepository';
import Conversation from '../entities/Conversation';

class MessagesRepository implements IMessagesRepository {
  private ormRepository: Repository<Conversation>;

  constructor() {
    this.ormRepository = getRepository(Conversation);
  }

  public async findAll(
    conversation_syncid: string,
    reader: string,
  ): Promise<Message[]> {
    return this.ormRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(Conversation);
      const conversation = await repository.findOne({
        where: { sync_id: conversation_syncid },
        lock: { mode: 'pessimistic_write' },
      });
      if (!conversation || !conversation.members.includes(reader)) {
        throw new AppError('Conversation access denied', 403);
      }
      const unread = conversation.members.map((member, index) =>
        member === reader ? 0 : conversation.unread?.[index] || 0,
      );
      // Reading does not reorder conversations by changing updated_at.
      await repository.update(conversation.id, {
        unread,
        updated_at: conversation.updated_at,
      });
      return conversation.messages || [];
    });
  }

  public async create(data: ICreateMessageDTO): Promise<Message> {
    return this.ormRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(Conversation);
      const conversation = await repository.findOne({
        where: { sync_id: data.conversation_syncid },
        lock: { mode: 'pessimistic_write' },
      });
      if (!conversation || !conversation.members.includes(data.sender)) {
        throw new AppError('Conversation access denied', 403);
      }
      const message: Message = {
        id: v4(),
        created_at: new Date().toISOString(),
        ...data,
      };
      const unread = conversation.members.map(
        (member, index) =>
          (conversation.unread?.[index] || 0) +
          (member === data.sender ? 0 : 1),
      );
      // User text is a bound parameter, never part of the SQL expression.
      await repository
        .createQueryBuilder()
        .update(Conversation)
        .set({
          messages: () =>
            'COALESCE(messages, ARRAY[]::jsonb[]) || ARRAY[CAST(:message AS jsonb)]',
          unread,
          updated_at: new Date(),
        })
        .where('id = :id', { id: conversation.id })
        .setParameter('message', JSON.stringify(message))
        .execute();
      return message;
    });
  }
}
export default MessagesRepository;
