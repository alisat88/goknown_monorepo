import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';

interface IRequestDTO {
  sender_id: string;
  receiver_id: string;
  sync_id: string;
}

@injectable()
class CreateNewConversationService {
  constructor(
    @inject('ConversationsRepository')
    private conversationsRepository: IConversationsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    sender_id,
    receiver_id,
    sync_id,
  }: IRequestDTO): Promise<any> {
    const hasReceiver = await this.usersRepository.findBySyncId(receiver_id);

    if (!hasReceiver) {
      throw new AppError('User not found');
    }

    if (sender_id === receiver_id) {
      throw new AppError(`You can't send message to yourself`);
    }

    const conversation = await this.conversationsRepository.create({
      members: [sender_id, receiver_id],
      sync_id,
    });
    return conversation;
  }
}

export default CreateNewConversationService;
