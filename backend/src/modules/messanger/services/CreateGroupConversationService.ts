import { inject, injectable } from 'tsyringe';
import { v4 } from 'uuid';
import AppError from '@shared/errors/AppError';
import canonicalizeAccountEmail from '@shared/utils/canonicalizeAccountEmail';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { EnumStatus } from '@modules/users/infra/typeorm/entities/User';
import IConversationsRepository from '../repositories/IConversationsRepository';
import Conversation from '../infra/typeorm/entities/Conversation';
import { groupConversationSchema } from '../dtos/groupConversationSchema';

@injectable()
export default class CreateGroupConversationService {
  constructor(
    @inject('ConversationsRepository')
    private conversations: IConversationsRepository,
    @inject('UsersRepository') private users: IUsersRepository,
  ) {}

  public async execute({
    creator,
    name,
    emails,
  }: {
    creator: string;
    name: string;
    emails: string[];
  }): Promise<Conversation> {
    const validation = groupConversationSchema.validate(
      { name, emails },
      { abortEarly: false },
    );
    if (validation.error) throw new AppError(validation.error.message);
    const owner = await this.users.findBySyncId(creator);
    if (!owner || owner.status !== EnumStatus.Active)
      throw new AppError('Active account required', 403);
    const normalized = (validation.value.emails as string[]).map(
      canonicalizeAccountEmail,
    );
    const errors: string[] = [];
    const seen = new Set<string>();
    const members = new Set<string>([owner.sync_id]);
    for (const email of normalized) {
      if (seen.has(email)) {
        errors.push(`Duplicate email: ${email}`);
        continue;
      }
      seen.add(email);
      if (email === canonicalizeAccountEmail(owner.email)) {
        errors.push(`Creator is included automatically: ${email}`);
        continue;
      }
      const user = await this.users.findByEmail(email);
      if (!user || user.status !== EnumStatus.Active) {
        errors.push(`No active account available for: ${email}`);
      } else if (members.has(user.sync_id)) {
        errors.push(`Participant already included: ${email}`);
      } else members.add(user.sync_id);
    }
    if (errors.length) throw new AppError(errors.join('; '));
    if (members.size < 3)
      throw new AppError('A group needs at least two other participants');
    return this.conversations.create({
      sync_id: v4(),
      members: Array.from(members),
      type: 'group',
      name: validation.value.name,
      created_by: owner.sync_id,
    });
  }
}
