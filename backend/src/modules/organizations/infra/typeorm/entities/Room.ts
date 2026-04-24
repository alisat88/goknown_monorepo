import DL from '@modules/dls/infra/typeorm/entities/DL';
import User from '@modules/users/infra/typeorm/entities/User';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Group from './Group';
import OrganizationUser from './OrganizationUser';

@Entity('organizationsrooms')
class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  sync_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column()
  admin_id: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column()
  group_id: string;

  @ManyToMany(() => DL, dl => dl.rooms)
  @JoinTable({
    name: 'rooms_dls',
    joinColumn: {
      name: 'room_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'dl_id',
      referencedColumnName: 'id',
    },
  })
  dls?: DL[];

  @ManyToMany(
    () => OrganizationUser,
    organizationuser => organizationuser.rooms,
  )
  @JoinTable({
    name: 'organizationsrooms_users',
    joinColumn: {
      name: 'room_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'organizationuser_id',
      referencedColumnName: 'id',
    },
  })
  members?: OrganizationUser[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default Room;
