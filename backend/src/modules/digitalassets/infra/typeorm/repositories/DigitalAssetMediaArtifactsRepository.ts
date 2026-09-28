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
    const existing = await this.findByAssetAndRole(
      data.digital_asset_id,
      data.role,
    );

    if (existing) {
      Object.assign(existing, data);
      return this.ormRepository.save(existing);
    }

    const artifact = this.ormRepository.create(data);
    return this.ormRepository.save(artifact);
  }
}

export default DigitalAssetMediaArtifactsRepository;
