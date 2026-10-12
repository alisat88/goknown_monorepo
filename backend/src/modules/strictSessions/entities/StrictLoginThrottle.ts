import { Entity, PrimaryColumn, Column } from 'typeorm';
@Entity('strict_login_throttles')
export class StrictLoginThrottle {
  @PrimaryColumn({ type: 'varchar', length: 64 }) key: string;
  @Column('integer') attempts: number;
  @Column('timestamptz') expires_at: Date;
}
