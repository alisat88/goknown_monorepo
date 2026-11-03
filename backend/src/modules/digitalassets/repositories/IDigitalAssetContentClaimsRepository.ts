/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ICreateDigitalAssetContentClaim from '../dtos/ICreateDigitalAssetContentClaim';
import DigitalAssetContentClaim from '../infra/typeorm/entities/DigitalAssetContentClaim';

export default interface IDigitalAssetContentClaimsRepository {
  findByContentHash(
    content_sha256: string,
    content_hash_scheme: string,
  ): Promise<DigitalAssetContentClaim | undefined>;

  claimFirst(
    data: ICreateDigitalAssetContentClaim,
  ): Promise<DigitalAssetContentClaim>;
}
