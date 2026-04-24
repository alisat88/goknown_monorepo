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
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import DigitalAsset from './DigitalAsset';

@Entity('folders')
class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  owner_id: string;

  @Column({ nullable: true })
  room_id: string;

  @Column({ nullable: true })
  sync_id: string;

  @Column({ default: true })
  editable: boolean;

  @Column({ default: false })
  welcome: boolean;

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

  @OneToMany(() => DigitalAsset, digitalAsset => digitalAsset.folder, {
    cascade: true,
    onDelete: 'SET NULL',
  })
  assets: DigitalAsset[];

  @ManyToMany(() => User, user => user.folders)
  @JoinTable({
    name: 'folders_users',
    joinColumn: {
      name: 'folder_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'usershared_id',
      referencedColumnName: 'id',
    },
  })
  shared_users?: User[];

  @ManyToMany(() => Group, group => group.folders)
  @JoinTable({
    name: 'folders_groups',
    joinColumn: {
      name: 'folder_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'groupshared_id',
      referencedColumnName: 'id',
    },
  })
  shared_groups?: Group[];
}

export default Folder;
