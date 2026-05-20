import IRecipientsUsersDTO from '../dtos/IRecipientsUsersDTO';
import User from '../infra/typeorm/entities/User';

export default interface IRecipientsUsersRepository {
  findAllRecipient(user_id: string): Promise<User[] | undefined>;
  findRecipientExists({
    user_id,
    recipient_id,
  }: IRecipientsUsersDTO): Promise<boolean | undefined>;
}
