/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateConversationDTO from '../dtos/ICreateConversationDTO';
import Conversation from '../infra/typeorm/entities/Conversation';

export default interface IConversationsRepository {
  create(data: ICreateConversationDTO): Promise<Conversation>;
  findAll(members: string[]): Promise<Conversation[]>;
  findById(conversation_id: string): Promise<Conversation | undefined>;
  findBySyncId(conversation_syncid: string): Promise<Conversation | undefined>;
  save(conversation: Conversation): Promise<void>;
}
