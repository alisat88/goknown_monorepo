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
  UpdateDateColumn,
} from 'typeorm';

export enum EnumConsensusVote {
  Approve = 'approve',
  Reject = 'reject',
}

@Entity('consensus_votes')
class ConsensusVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposal_id: string;

  @Column()
  transaction_sync_id: string;

  @Column()
  node_name: string;

  @Column({
    type: 'varchar',
  })
  vote: EnumConsensusVote;

  @Column({ nullable: true })
  reason?: string | null;

  @Column()
  payload_hash: string;

  @Column({ nullable: true })
  signature?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default ConsensusVote;
