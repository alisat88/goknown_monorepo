import ICreateDigitalAssetMediaArtifact from '@modules/digitalassets/dtos/ICreateDigitalAssetMediaArtifact';
import DigitalAssetMediaArtifact, {
  MediaArtifactRole,
} from '@modules/digitalassets/infra/typeorm/entities/DigitalAssetMediaArtifact';
import IDigitalAssetMediaArtifactsRepository from '@modules/digitalassets/repositories/IDigitalAssetMediaArtifactsRepository';
import { getRepository, Repository } from 'typeorm';

class DigitalAssetMediaArtifactsRepository
  implements IDigitalAssetMediaArtifactsRepository
{
  private ormRepository: Repository<DigitalAssetMediaArtifact>;

  constructor() {
    this.ormRepository = getRepository(DigitalAssetMediaArtifact);
  }

  public async findByAssetAndRole(
    digital_asset_id: string,
    role: MediaArtifactRole,
  ): Promise<DigitalAssetMediaArtifact | undefined> {
    return this.ormRepository.findOne({
      where: {
        digital_asset_id,
        role,
      },
    });
  }

  public async saveArtifact(
    data: ICreateDigitalAssetMediaArtifact,
  ): Promise<DigitalAssetMediaArtifact> {
    await this.ormRepository
      .createQueryBuilder()
      .insert()
      .into(DigitalAssetMediaArtifact)
      .values(data)
      .onConflict(`
        ("digital_asset_id", "role")
        DO UPDATE SET
          "storage_key" = EXCLUDED."storage_key",
          "mimetype" = EXCLUDED."mimetype",
          "file_sha256" = EXCLUDED."file_sha256",
          "content_sha256" = EXCLUDED."content_sha256",
          "content_hash_scheme" = EXCLUDED."content_hash_scheme",
          "derived_from_id" = EXCLUDED."derived_from_id"
      `)
      .execute();

    const artifact = await this.findByAssetAndRole(
      data.digital_asset_id,
      data.role,
    );

    if (!artifact) {
      throw new Error(
        'Unable to create or retrieve media artifact',
      );
    }

    return artifact;
  }
}

export default DigitalAssetMediaArtifactsRepository;
