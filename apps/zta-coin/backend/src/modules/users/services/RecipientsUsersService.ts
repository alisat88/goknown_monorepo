import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import { EnumStatus } from '../infra/typeorm/entities/User';
import IRecipientsUsersRepository from '../repositories/IRecipientsUsersRepository';
import IUsersRepository from '../repositories/IUsersRepository';

interface IRequest {
  user_id: string;
  recipient_id: string;
}

@injectable()
class RecipientsUsersService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('RecipientsUsersRepository')
    private recipientsUsersRepository: IRecipientsUsersRepository,
  ) {}

  public async execute({ user_id, recipient_id }: IRequest): Promise<void> {
    const user = await this.usersRepository.findBySyncId(user_id);
    const userRecipiented = await this.usersRepository.findBySyncId(
      recipient_id,
    );

    if (!userRecipiented) {
      throw new AppError('The user you want to recipient does not exist');
    }

    if (userRecipiented.status === EnumStatus.Inactive) {
      throw new AppError('The user you want to recipient does not exist');
    }

    if (user_id === userRecipiented.id) {
      throw new AppError('It is not possible to favor yourself');
    }

    if (user) {
      const isAlreadyUserRecipient = await this.recipientsUsersRepository.findRecipientExists(
        {
          user_id,
          recipient_id,
        },
      );

      if (isAlreadyUserRecipient) {
        throw new AppError('User is already recipient');
      }

      const recipients = await this.recipientsUsersRepository.findAllRecipient(
        user.id,
      );

      if (recipients) {
        user.recipient = [...recipients, userRecipiented];
      } else {
        user.recipient = [userRecipiented];
      }

      await this.usersRepository.save(user);
    }
  }
}

export default RecipientsUsersService;
