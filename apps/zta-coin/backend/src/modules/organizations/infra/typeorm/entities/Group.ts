import User from '@modules/users/infra/typeorm/entities/User';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Organization from './Organization';
import Room from './Room';

export enum EnumStatus {
  Active = 'active',
  Inactive = 'inactive',
}

@Entity('organizationsgroups')
class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sync_id: string;

  @Column()
  name: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column()
  admin_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Room, room => room.group)
  rooms: Room[];

  @Column()
  organization_id: string;

  @Column({
    type: 'enum',
    enum: EnumStatus,
    default: EnumStatus.Active,
  })
  status: EnumStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default Group;
