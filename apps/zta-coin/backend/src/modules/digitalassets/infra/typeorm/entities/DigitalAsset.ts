import User from '@modules/users/infra/typeorm/entities/User';
import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import uploadConfig from '@config/upload';
import Folder from './Folder';
import Room from '@modules/organizations/infra/typeorm/entities/Room';

/**
 * Privacy Enum
 */
export enum EnumPrivacy {
  Public = 'public',
  Private = 'private',
}

/**
 * Token Type Enum (NEW 🔥)
 */
export enum TokenType {
  NFT = 'NFT',
  BADGE = 'BADGE',
  REWARD = 'REWARD',
}

@Entity('digitalassets')
class DigitalAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false, unique: true })
  token: string;

  /**
   * 🔥 NEW: Tokenization fields
   */
  @Column({ nullable: true })
  token_id: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    nullable: true,
  })
  token_type: TokenType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  /**
   * 🔥 NEW: Traceability (link to transaction)
   */
  @Column({ nullable: true })
  minted_from_tx: string;

  /**
   * Existing file/storage fields
   */
  @Column({ nullable: false })
  mimetype: string;

  @Column({ nullable: false })
  filename: string;

  @Column({ nullable: false })
  user_id: string;

  @Column({ nullable: true })
  folder_id: string;

  @Column({ nullable: true })
  sync_id: string;

  @Column({ nullable: true })
  room_id: string;

  @Column({ default: false })
  shared: boolean;

  /**
   * Relationships
   */
  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({
    type: 'enum',
    enum: EnumPrivacy,
    default: EnumPrivacy.Public,
  })
  privacy: EnumPrivacy;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Folder, folder => folder.assets, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  /**
   * Timestamps
   */
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  /**
   * Asset URL (unchanged)
   */
  @Expose({ name: 'asset_url' })
  getAssetUrl(): string | null {
    if (!this.filename) {
      return null;
    }

    switch (uploadConfig.driver) {
      case 'disk':
        return `${process.env.APP_API_URL}/files/${this.filename}`;
      case 's3':
        return `https://${uploadConfig.config.aws.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${this.filename}`;
      case 'digitalocean':
        return `${process.env.DO_SPACE_URL}/nfts/${this.filename}`;
      default:
        return null;
    }
  }
}

export default DigitalAsset;
