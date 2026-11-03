/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
export default interface ICreateDigitalAssetContentClaim {
  content_sha256: string;
  content_hash_scheme: string;
  first_digital_asset_id: string;
  first_user_id: string | null;
  first_source_file_sha256: string;
  first_seen_at: Date;
}
