/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MediaArtifactRole {
  Source = 'source',
  Preservation = 'preservation',
  Playback = 'playback',
}

@Entity('digitalasset_media_artifacts')
class DigitalAssetMediaArtifact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  digital_asset_id: string;

  @Column({ type: 'varchar' })
  role: MediaArtifactRole;

  @Column({ type: 'text' })
  storage_key: string;

  @Column()
  mimetype: string;

  @Column({ type: 'varchar', length: 64 })
  file_sha256: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  content_sha256: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  content_hash_scheme: string | null;

  @Column({ type: 'uuid', nullable: true })
  derived_from_id: string | null;

  @CreateDateColumn()
  created_at: Date;
}

export default DigitalAssetMediaArtifact;
