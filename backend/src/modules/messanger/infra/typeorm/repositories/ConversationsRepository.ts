import Conversation from '../entities/Conversation';
import { getRepository, Repository } from 'typeorm';

import IConversationsRepository from '../../../repositories/IConversationsRepository';
import ICreateConversationDTO from '@modules/messanger/dtos/ICreateConversationDTO';

class ConversationsRepository implements IConversationsRepository {
  // private ormRepository: MongoRepository<Conversation>;
  private ormRepository: Repository<Conversation>;

  constructor() {
    // this.ormRepository = getMongoRepository(Conversation, 'mongo');
    this.ormRepository = getRepository(Conversation);
  }

  public async findById(
    conversation_id: string,
  ): Promise<Conversation | undefined> {
    const conversation = await this.ormRepository.findOne(conversation_id);
    return conversation;
  }

  public async findBySyncId(
    conversation_syncid: string,
  ): Promise<Conversation | undefined> {
    const conversation = await this.ormRepository.findOne({
      where: { sync_id: conversation_syncid },
    });
    return conversation;
  }

  public async findAll(members: string[]): Promise<Conversation[]> {
    const membersJSON = JSON.stringify(members);
    const conversations = await this.ormRepository
      .createQueryBuilder('conversation')
      .where('conversation.members @> :members', { members: membersJSON })
      .getMany();
    return conversations;
  }

  public async create(data: ICreateConversationDTO): Promise<Conversation> {
    const conversation = this.ormRepository.create({ ...data });

    await this.ormRepository.save(conversation);

    return conversation;
  }

  public async save({ unread, updated_at, id }: Conversation): Promise<void> {
    await this.ormRepository.update(id, { unread, updated_at });
  }
}

export default ConversationsRepository;
