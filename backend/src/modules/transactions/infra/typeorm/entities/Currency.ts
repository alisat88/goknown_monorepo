import Organization from '@modules/organizations/infra/typeorm/entities/Organization';
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

export enum EnumStatus {
  Active = 'active',
  Inactive = 'inactive',
}

@Entity('currencies')
class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  organization_id: string;

  // @Column({ nullable: true })
  // sync_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({
    type: 'enum',
    enum: EnumStatus,
    default: EnumStatus.Active,
  })
  status: EnumStatus;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default Currency;
