/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateDigitalAssetMediaArtifact from '../dtos/ICreateDigitalAssetMediaArtifact';
import DigitalAssetMediaArtifact, {
  MediaArtifactRole,
} from '../infra/typeorm/entities/DigitalAssetMediaArtifact';

export default interface IDigitalAssetMediaArtifactsRepository {
  findByAssetAndRole(
    digital_asset_id: string,
    role: MediaArtifactRole,
  ): Promise<DigitalAssetMediaArtifact | undefined>;

  saveArtifact(
    data: ICreateDigitalAssetMediaArtifact,
  ): Promise<DigitalAssetMediaArtifact>;
}
