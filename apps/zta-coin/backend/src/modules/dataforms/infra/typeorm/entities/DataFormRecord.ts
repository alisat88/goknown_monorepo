import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import DataForm from './DataForm';

@Entity('dataformsrecords')
class DataFormRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  form_id: string;

  @Column({ type: 'json' })
  value_json: string;

  @Column({ nullable: true })
  sync_id: string;

  @ManyToOne(() => DataForm)
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

export default DataFormRecord;
