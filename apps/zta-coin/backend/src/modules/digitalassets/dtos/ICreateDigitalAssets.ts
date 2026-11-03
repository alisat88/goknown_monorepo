/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { EnumPrivacy } from '../infra/typeorm/entities/DigitalAsset';

export default interface ICreateDigitalAssets {
  name: string;
  description?: string;
  token?: string;
  mimetype: string;
  filename: string;
  user_id: string;
  sync_id: string;
  folder_id: string;
  shared: boolean;
  editable?: boolean;
  room_id?: string | null;
  privacy: EnumPrivacy;
}
