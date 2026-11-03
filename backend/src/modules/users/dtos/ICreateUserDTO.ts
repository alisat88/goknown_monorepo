/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { EnumRole } from '../infra/typeorm/entities/User';
export default interface ICreateUserDTO {
  name: string;
  email: string;
  password: string;
  pin: string;
  sync_id: string | undefined;
  pin_created_at?: Date | null | undefined;
  twoFactorAuthentication: boolean;
  role: EnumRole;
}
