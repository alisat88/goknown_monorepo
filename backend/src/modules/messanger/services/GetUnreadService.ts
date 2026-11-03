/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { inject, injectable } from 'tsyringe';
import IConversationsRepository from '../repositories/IConversationsRepository';

@injectable()
export default class GetUnreadService {
  constructor(
    @inject('ConversationsRepository')
    private conversations: IConversationsRepository,
  ) {}
  public async execute(
    usersync_id: string,
  ): Promise<{ unread: number; conversations: Record<string, number> }> {
    const rows = await this.conversations.findAll([usersync_id]);
    const conversations: Record<string, number> = {};
    for (const row of rows) {
      const index = row.members.indexOf(usersync_id);
      if (index >= 0) conversations[row.sync_id] = row.unread?.[index] || 0;
    }
    return {
      conversations,
      unread: Object.values(conversations).reduce(
        (sum, count) => sum + count,
        0,
      ),
    };
  }
}
