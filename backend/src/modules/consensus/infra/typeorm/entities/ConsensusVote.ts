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

  @Column()
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
