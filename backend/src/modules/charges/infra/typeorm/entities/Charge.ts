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

export enum EnumMethod {
  Fake = 'fake',
  Card = 'card',
  Paypal = 'paypal',
}

export enum EnumProcess {
  Pending = 'pending',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Entity('charges')
class Charge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: EnumMethod,
    default: EnumMethod.Fake,
  })
  method: EnumMethod;

  @Column({
    type: 'enum',
    enum: EnumProcess,
    default: EnumProcess.Pending,
  })
  process: EnumProcess;

  @Column('decimal')
  amount: number;

  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default Charge;
