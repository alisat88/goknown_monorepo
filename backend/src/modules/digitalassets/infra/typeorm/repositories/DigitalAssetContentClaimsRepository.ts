import ICreateDigitalAssetContentClaim from '@modules/digitalassets/dtos/ICreateDigitalAssetContentClaim';
import DigitalAssetContentClaim from '@modules/digitalassets/infra/typeorm/entities/DigitalAssetContentClaim';
import IDigitalAssetContentClaimsRepository from '@modules/digitalassets/repositories/IDigitalAssetContentClaimsRepository';
import { getRepository, Repository } from 'typeorm';

class DigitalAssetContentClaimsRepository
  implements IDigitalAssetContentClaimsRepository
{
  private ormRepository: Repository<DigitalAssetContentClaim>;

  constructor() {
    this.ormRepository = getRepository(DigitalAssetContentClaim);
  }

  public async findByContentHash(
    content_sha256: string,
    content_hash_scheme: string,
  ): Promise<DigitalAssetContentClaim | undefined> {
    return this.ormRepository.findOne({
      where: {
        content_sha256,
        content_hash_scheme,
      },
    });
  }

  public async claimFirst(
    data: ICreateDigitalAssetContentClaim,
  ): Promise<DigitalAssetContentClaim> {
    await this.ormRepository
      .createQueryBuilder()
      .insert()
      .into(DigitalAssetContentClaim)
      .values(data)
      .onConflict(
        '("content_hash_scheme", "content_sha256") DO NOTHING',
      )
      .execute();

    const claim = await this.findByContentHash(
      data.content_sha256,
      data.content_hash_scheme,
    );

    if (!claim) {
      throw new Error(
        'Unable to create or retrieve first-seen content claim',
      );
    }

    return claim;
  }
}

export default DigitalAssetContentClaimsRepository;
