import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import Message from './Message';
import { Exclude } from 'class-transformer';

@Entity('conversations')
class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sync_id: string;

  @Column({ type: 'varchar', default: 'direct' })
  type: 'direct' | 'group';

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column('jsonb')
  members: string[];

  @Column('jsonb')
  unread: number[] = [0, 0];

  @Column('jsonb', { array: true, nullable: true })
  messages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;
}

export default Conversation;
