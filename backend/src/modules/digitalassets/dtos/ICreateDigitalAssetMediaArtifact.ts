/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { MediaArtifactRole } from '../infra/typeorm/entities/DigitalAssetMediaArtifact';

export default interface ICreateDigitalAssetMediaArtifact {
  digital_asset_id: string;
  role: MediaArtifactRole;
  storage_key: string;
  mimetype: string;
  file_sha256: string;
  content_sha256?: string | null;
  content_hash_scheme?: string | null;
  derived_from_id?: string | null;
}
