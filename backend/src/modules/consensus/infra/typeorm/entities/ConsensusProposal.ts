import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumConsensusProposalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Failed = 'failed',
}

@Entity('consensus_proposals')
class ConsensusProposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  proposal_id: string;

  @Column()
  transaction_sync_id: string;

  @Column()
  payload_hash: string;

  @Column('jsonb')
  payload: any;

  @Column()
  originating_node: string;

  @Column({
    type: 'varchar',
    default: EnumConsensusProposalStatus.Pending,
  })
  status: EnumConsensusProposalStatus;

  @Column({ default: 0 })
  approval_count: number;

  @Column({ default: 0 })
  rejection_count: number;

  @Column({ nullable: true })
  failure_reason?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  finalized_at?: Date | null;
}

export default ConsensusProposal;
