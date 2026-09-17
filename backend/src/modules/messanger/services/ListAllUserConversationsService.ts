import AppError from '@shared/errors/AppError';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';
import User, { EnumStatus } from '@modules/users/infra/typeorm/entities/User';
import { classToClass } from 'class-transformer';
import IRoomsRepository from '@modules/organizations/repositories/IRoomsRepository';

@injectable()
class ListAllUserConversationsService {
  constructor(
    @inject('ConversationsRepository')
    private conversationsRepository: IConversationsRepository,
    @inject('UsersRepository') private usersRepository: IUsersRepository,
    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute({
    usersync_id,
    room_id,
  }: {
    usersync_id: string;
    room_id?: string;
  }): Promise<any[]> {
    const user = await this.usersRepository.findBySyncId(usersync_id);
    if (!user) throw new AppError('User not found');
    const conversations = (
      await this.conversationsRepository.findAll([usersync_id])
    ).filter(conversation => conversation.members.includes(usersync_id));
    const users: User[] = room_id
      ? await this.organizationsRoomsRepository.findAllMembers(room_id)
      : (await this.usersRepository.findAll({
          status: [EnumStatus.Active, EnumStatus.ConfirmEmail],
        })) || [];
    const profiles = new Map(users.map(profile => [profile.sync_id, profile]));
    const memberIds = Array.from(
      new Set(conversations.flatMap(conversation => conversation.members)),
    );
    await Promise.all(
      memberIds
        .filter(id => !profiles.has(id))
        .map(async id => {
          const profile = await this.usersRepository.findBySyncId(id);
          if (profile) profiles.set(id, profile);
        }),
    );
    const summary = (conversation: (typeof conversations)[number]) => ({
      id: conversation.id,
      sync_id: conversation.sync_id,
      type: conversation.type || 'direct',
      name: conversation.name,
      members: conversation.members,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      participants:
        conversation.type === 'group'
          ? conversation.members.map(id => ({
              sync_id: id,
              name: profiles.get(id)?.name || 'Member',
            }))
          : undefined,
    });
    const directUsers = Array.from(profiles.values()).filter(
      profile =>
        profile.sync_id !== usersync_id &&
        (users.some(u => u.sync_id === profile.sync_id) ||
          (!room_id &&
            conversations.some(
              c => c.type !== 'group' && c.members.includes(profile.sync_id),
            ))),
    );
    const direct = directUsers.map(profile => {
      const conversation = conversations.find(
        c =>
          c.type !== 'group' &&
          c.members.length === 2 &&
          c.members.includes(profile.sync_id),
      );
      return {
        ...classToClass(profile),
        online: false,
        news:
          conversation?.unread?.[conversation.members.indexOf(usersync_id)] ||
          0,
        conversation: conversation ? summary(conversation) : undefined,
      };
    });
    // Messenger groups are independent of the separate Organizations/Groups apps.
    const groups = room_id
      ? []
      : conversations
          .filter(c => c.type === 'group')
          .map(conversation => ({
            id: conversation.id,
            sync_id: conversation.sync_id,
            name: conversation.name || 'Group',
            avatar_url: '',
            online: false,
            news:
              conversation.unread?.[
                conversation.members.indexOf(usersync_id)
              ] || 0,
            conversation: summary(conversation),
          }));
    return [...direct, ...groups].sort(
      (a, b) =>
        new Date(b.conversation?.updated_at || 0).getTime() -
        new Date(a.conversation?.updated_at || 0).getTime(),
    );
  }
}
export default ListAllUserConversationsService;
