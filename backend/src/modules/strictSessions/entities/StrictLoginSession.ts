import { Entity, PrimaryColumn, Column } from 'typeorm';
@Entity('strict_login_sessions')
export class StrictLoginSession {
  @PrimaryColumn({ type: 'varchar', length: 64 }) hash: string;
  @Column('uuid') user_id: string;
  @Column({ type: 'varchar', length: 64 }) credential_hash: string;
  @Column('timestamptz') expires_at: Date;
  @Column({ type: 'timestamptz', nullable: true }) revoked_at: Date | null;
}
