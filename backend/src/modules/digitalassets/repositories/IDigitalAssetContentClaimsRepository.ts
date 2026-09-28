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
