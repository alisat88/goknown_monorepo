/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import IRecipientsUsersDTO from '../dtos/IRecipientsUsersDTO';
import User from '../infra/typeorm/entities/User';

export default interface IRecipientsUsersRepository {
  findAllRecipient(user_id: string): Promise<User[] | undefined>;
  findRecipientExists({
    user_id,
    recipient_id,
  }: IRecipientsUsersDTO): Promise<boolean | undefined>;
}
