import { Entity, PrimaryColumn, Column } from 'typeorm';
@Entity('strict_login_challenges')
export class StrictLoginChallenge {
  @PrimaryColumn({ type: 'varchar', length: 64 }) hash: string;
  @Column('uuid') user_id: string;
  @Column({ type: 'varchar', length: 64 }) code_hash: string;
  @Column({ type: 'varchar', length: 32 }) salt: string;
  @Column({ type: 'varchar', length: 64 }) credential_hash: string;
  @Column('timestamptz') expires_at: Date;
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ type: 'timestamptz', nullable: true }) consumed_at: Date | null;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
