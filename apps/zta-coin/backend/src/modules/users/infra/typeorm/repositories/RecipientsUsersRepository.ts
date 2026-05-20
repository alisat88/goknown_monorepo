import IRecipientsUsersRepository from '@modules/users/repositories/IRecipientsUsersRepository';
import IRecipientsUsersDTO from '@modules/users/dtos/IRecipientsUsersDTO';

import { Repository, getRepository } from 'typeorm';
import User, { EnumStatus } from '../entities/User';

class RecipientsUsersRepository implements IRecipientsUsersRepository {
  private ormRepository: Repository<User>;

  constructor() {
    this.ormRepository = getRepository(User);
  }

  public async findRecipientExists({
    user_id,
    recipient_id,
  }: IRecipientsUsersDTO): Promise<boolean> {
    const user = await this.ormRepository.findOne({
      where: { id: user_id },
      relations: ['recipient'],
    });
    if (user) {
      const exists = !!user.recipient.find(
        recipient => recipient.id === recipient_id,
      );

      return exists;
    }
    return false;
  }

  public async findAllRecipient(user_id: string): Promise<User[] | undefined> {
    const recipientsUsers = await this.ormRepository.findOne({
      where: { id: user_id },
      relations: ['recipient'],
    });
    if (recipientsUsers) {
      return recipientsUsers.recipient.filter(
        recipient => recipient.status !== EnumStatus.Inactive,
      );
    }
  }
}

export default RecipientsUsersRepository;
