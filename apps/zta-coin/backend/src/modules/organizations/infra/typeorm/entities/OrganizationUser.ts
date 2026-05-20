import User from '@modules/users/infra/typeorm/entities/User';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Organization from './Organization';
import Room from './Room';

export enum EnumRole {
  Admin = 'admin',
  Owner = 'owner',
  User = 'user',
}

export enum EnumStatus {
  Active = 'active',
  Pending = 'pending',
  Inactive = 'inactive',
}

@Entity('organizations_users')
class OrganizationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column()
  // sync_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organization_id: string;

  @Column({
    type: 'enum',
    enum: EnumRole,
    // default: EnumStatus.ConfirmEmail,
  })
  role: EnumRole;

  @Column({
    type: 'enum',
    enum: EnumStatus,
  })
  status: EnumStatus;

  @ManyToMany(() => Room, room => room.members)
  rooms?: Room[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default OrganizationUser;
