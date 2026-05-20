import ICreateMessageDTO from '../dtos/ICreateMessageDTO';
import Message from '../infra/typeorm/entities/Message';

export default interface IMessagesRepository {
  findAll(conversationsync_id: string): Promise<Message[]>;
  create(data: ICreateMessageDTO): Promise<Message | undefined>;
}
