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
  OneToOne,
} from 'typeorm';
import DataForm from './DataForm';

export enum EnumPrivacy {
  Public = 'public',
  Private = 'private',
}

@Entity('dataformsstructures')
class DataFormStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  form_id: string;

  @Column({ type: 'json' })
  value_json: string;

  @Column({ nullable: false })
  owner_id: string;

  @Column({ nullable: true })
  sync_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToOne(() => DataForm)
  @JoinColumn({ name: 'form_id' })
  dataform: DataForm;

  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default DataFormStructure;
