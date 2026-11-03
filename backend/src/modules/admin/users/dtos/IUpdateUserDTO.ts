/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import {
  EnumRole,
  EnumStatus,
} from '@modules/users/infra/typeorm/entities/User';

export default interface IUpdateUserDTO {
  name?: string;
  //   email?: string;
  password?: string;
  twoFactorAuthentication?: boolean;
  role?: EnumRole;
  status?: EnumStatus;
}
