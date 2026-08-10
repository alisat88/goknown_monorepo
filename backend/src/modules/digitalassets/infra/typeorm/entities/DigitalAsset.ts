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

export enum EnumPrivacy {
  Public = 'public',
  Private = 'private',
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

  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  @Expose({ name: 'asset_url' })
  getAssetUrl(): string | null {
    if (!this.filename) {
      return null;
    }

    switch (uploadConfig.driver) {
      case 'disk':
        return this.filename
          ? `${process.env.APP_API_URL}/files/${this.filename}`
          : null;
      case 's3':
      case 'digitalocean':
        if (!uploadConfig.config.aws.publicUrl) {
          return null;
        }
        return `${uploadConfig.config.aws.publicUrl.replace(/\/$/, '')}/${
          uploadConfig.config.aws.keyPrefix
            ? `${uploadConfig.config.aws.keyPrefix.replace(/^\/+|\/+$/g, '')}/`
            : ''
        }${encodeURIComponent(this.filename)}`;
      default:
        return null;
    }
  }
}

export default DigitalAsset;
