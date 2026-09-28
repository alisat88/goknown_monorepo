export default interface ICreateDigitalAssetContentClaim {
  content_sha256: string;
  content_hash_scheme: string;
  first_digital_asset_id: string;
  first_user_id: string | null;
  first_source_file_sha256: string;
  first_seen_at: Date;
}
