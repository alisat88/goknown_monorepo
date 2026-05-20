import DataForm from '@modules/dataforms/infra/typeorm/entities/DataForm';
import Folder from '@modules/digitalassets/infra/typeorm/entities/Folder';
import User from '@modules/users/infra/typeorm/entities/User';
import { Exclude, Expose } from 'class-transformer';
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

@Entity('groups')
class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: false })
  owner_id: string;

  @Column({ nullable: true })
  sync_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => Folder, folder => folder.shared_groups)
  folders: Folder[];

  @ManyToMany(() => DataForm, dataform => dataform.shared_groups)
  forms: DataForm[];

  @ManyToMany(() => User, user => user.groups, { eager: true })
  @JoinTable({
    name: 'groups_users',
    joinColumn: {
      name: 'group_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'usershared_id',
      referencedColumnName: 'id',
    },
  })
  shared_users?: User[];

  @Expose({ name: 'members' })
  getMembers(): number {
    if (this.shared_users) {
      return this.shared_users.length;
    }
    return 0;
  }
}

export default Group;
