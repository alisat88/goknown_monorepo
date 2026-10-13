import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('zta_personal_accounts')
export class ZtaPersonalAccount {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  account_id: string;

  @Column({ type: 'uuid', unique: true })
  dapp_user_id: string;

  @Column({ type: 'numeric', precision: 30, scale: 8 })
  balance: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
