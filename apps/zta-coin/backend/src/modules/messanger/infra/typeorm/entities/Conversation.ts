/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import Message from './Message';
import { Exclude } from 'class-transformer';

@Entity('conversations')
class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sync_id: string;

  @Column('jsonb', { array: true })
  members: string[];

  @Column('jsonb', { array: true })
  unread: number[] = [0, 0];

  @Column('jsonb', { array: true, nullable: true })
  messages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default Conversation;
