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
