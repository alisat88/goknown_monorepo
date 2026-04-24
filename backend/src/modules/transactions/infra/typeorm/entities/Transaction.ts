import Charge from '@modules/charges/infra/typeorm/entities/Charge';
import Organization from '@modules/organizations/infra/typeorm/entities/Organization';
import User from '@modules/users/infra/typeorm/entities/User';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumCategory {
  Transaction = 'transaction',
  Charge = 'charge',
}

export enum EnumTransactionType {
  Sent = 'sent',
  Received = 'received',
}

export enum EnumStatus {
  Pending = 'pending',
  Approved = 'approved',
  Unapproved = 'unapproved',
  Failed = 'failed',
}

@Entity('transactions')
class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EnumCategory,
  })
  category: EnumCategory;

  @Column({
    type: 'enum',
    enum: EnumTransactionType,
  })
  transactionType: EnumTransactionType;

  @Column({
    type: 'enum',
    enum: EnumStatus,
    default: EnumStatus.Pending,
  })
  status: EnumStatus;

  @Column('decimal')
  amount: number;

  @Column('decimal')
  balance: number;

  @Column({ nullable: true })
  message: string;

  @Column()
  to_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  touser: User;

  @Column({ nullable: true })
  from_user_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'from_user_id' })
  fromuser: User;

  @Column({ nullable: true })
  charge_id: string;

  @ManyToOne(() => Charge)
  @JoinColumn({ name: 'charge_id' })
  charge: Charge;

  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  @Column({ nullable: true })
  sync_id: string;
}

export default Transaction;
