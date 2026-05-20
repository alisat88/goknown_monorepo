import Group from '@modules/groups/infra/typeorm/entities/Group';
import Room from '@modules/organizations/infra/typeorm/entities/Room';
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

export enum EnumPrivacy {
  Public = 'public',
  Private = 'private',
}

@Entity('dataforms')
class DataForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: EnumPrivacy,
    default: EnumPrivacy.Public,
  })
  privacy: EnumPrivacy;

  @Column({ nullable: false })
  owner_id: string;

  @Column({ nullable: true })
  sync_id: string;

  @Column({ nullable: true })
  room_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => Group, group => group.forms)
  @JoinTable({
    name: 'dataforms_groups',
    joinColumn: {
      name: 'dataforms_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'groupshared_id',
      referencedColumnName: 'id',
    },
  })
  shared_groups?: Group[];
}

export default DataForm;
