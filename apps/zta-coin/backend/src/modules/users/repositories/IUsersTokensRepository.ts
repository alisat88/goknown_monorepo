/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import UserToken from '../infra/typeorm/entities/UserToken';

export default interface IUsersTokensRepository {
  generate(user_id: string, token?: string): Promise<UserToken>;
  findByToken(token: string): Promise<UserToken | undefined>;
}
