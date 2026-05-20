import ICreateConversationDTO from '../dtos/ICreateConversationDTO';
import Conversation from '../infra/typeorm/entities/Conversation';

export default interface IConversationsRepository {
  create(data: ICreateConversationDTO): Promise<Conversation>;
  findAll(members: string[]): Promise<Conversation[]>;
  findById(conversation_id: string): Promise<Conversation | undefined>;
  findBySyncId(conversation_syncid: string): Promise<Conversation | undefined>;
  save(conversation: Conversation): Promise<void>;
}
