import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';
import User, { EnumStatus } from '@modules/users/infra/typeorm/entities/User';
import { classToClass } from 'class-transformer';
import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';

interface IRequestDTO {
  usersync_id: string;
  room_id?: string;
}

@injectable()
class ListAllUserConversationsService {
  constructor(
    @inject('ConversationsRepository')
    private conversationsRepository: IConversationsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute({ usersync_id, room_id }: IRequestDTO): Promise<any[]> {
    const user = await this.usersRepository.findBySyncId(usersync_id);

    if (!user) {
      throw new AppError('User not found');
    }

    const conversations = await this.conversationsRepository.findAll([
      user.sync_id,
    ]);

    let users: User[] = [];

    if (room_id) {
      users = classToClass(
        await this.organizationsRoomsRepository.findAllMembers(room_id),
      );
    } else {
      users = classToClass(
        (await this.usersRepository.findAll({
          status: [EnumStatus.Active, EnumStatus.ConfirmEmail],
        })) || [],
      );
    }

    // look up all users from room

    if (!users) {
      throw new AppError('Users not found');
    }

    // nversations.find(
    //   conversation =>
    //     conversation.unread[
    //       conversation.members.findIndex(member => member === usersync_id)
    //     ],
    // ),

    const usersConversations = users
      .filter(u => u.sync_id !== user.sync_id)
      .map((u: User) => ({
        ...u,
        online: false,
        news: conversations.map(conversation => {
          const userIndex = conversation.members.findIndex(
            member => member === u.sync_id,
          );
          return conversation.unread[userIndex];
        })[0],
        conversation: conversations.find(conversation =>
          conversation.members.includes(u.sync_id),
        ),
      }))
      .sort((a, b) => (b.created_at as any) - (a.created_at as any))
      .sort((a, b) => {
        if (a.conversation && b.conversation) {
          const dateA: any = new Date(a.conversation.updated_at) || new Date();
          const dateB: any = new Date(b.conversation.updated_at) || new Date();
          return dateB - dateA;
        } else {
          return -1;
        }
      });

    return usersConversations;
  }
}

export default ListAllUserConversationsService;
