import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('digitalasset_content_claims')
class DigitalAssetContentClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  content_sha256: string;

  @Column({ type: 'varchar', length: 64 })
  content_hash_scheme: string;

  @Column({ type: 'uuid' })
  first_digital_asset_id: string;

  @Column({ type: 'uuid', nullable: true })
  first_user_id: string | null;

  @Column({ type: 'varchar', length: 64 })
  first_source_file_sha256: string;

  @Column({ type: 'timestamptz' })
  first_seen_at: Date;
}

export default DigitalAssetContentClaim;
