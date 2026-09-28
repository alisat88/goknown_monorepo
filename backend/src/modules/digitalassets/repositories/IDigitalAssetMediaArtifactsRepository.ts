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
