import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('zta_handoff_transactions')
export class ZtaHandoffTransaction {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  hash: string;

  @Column({ type: 'varchar', length: 64 })
  state_hash: string;

  @Column({ type: 'varchar', length: 64 })
  verifier_hash: string;

  @Column({ type: 'varchar', length: 128 })
  client_id: string;

  @Column({ type: 'varchar', length: 2048 })
  redirect_uri: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
