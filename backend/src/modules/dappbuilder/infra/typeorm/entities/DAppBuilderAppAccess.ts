import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import User from '@modules/users/infra/typeorm/entities/User';
import DAppBuilderApp from './DAppBuilderApp';

@Entity('dapp_builder_app_access')
@Unique(['app_id', 'user_id'])
class DAppBuilderAppAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id' })
  app_id: string;

  @ManyToOne(() => DAppBuilderApp, (app) => app.access_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: DAppBuilderApp;

  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Viewer | Builder | Reviewer
  @Column({ default: 'Viewer' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

export default DAppBuilderAppAccess;
