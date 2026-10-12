import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('zta_auth_sessions')
export class ZtaAuthSession {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  hash: string;

  @Column({ type: 'uuid' })
  dapp_user_id: string;

  @Column({ type: 'varchar', length: 64 })
  parent_session_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
