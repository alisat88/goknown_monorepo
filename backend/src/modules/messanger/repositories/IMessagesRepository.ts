/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateMessageDTO from '../dtos/ICreateMessageDTO';
import Message from '../infra/typeorm/entities/Message';

export default interface IMessagesRepository {
  findAll(conversationsync_id: string, reader: string): Promise<Message[]>;
  create(data: ICreateMessageDTO): Promise<Message>;
}
