import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import User from '@modules/users/infra/typeorm/entities/User';
import DAppBuilderAppAccess from './DAppBuilderAppAccess';

@Entity('dapp_builder_apps')
class DAppBuilderApp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  owner_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'dapp_name' })
  dapp_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'user_prompt', type: 'text', nullable: true })
  user_prompt: string;

  @Column({ nullable: true })
  template: string;

  @Column({ default: 'Draft' })
  status: string;

  @Column({ name: 'generated_code', type: 'text', nullable: true })
  generated_code: string;

  @Column({ name: 'generated_config', type: 'text', nullable: true })
  generated_config: string;

  @Column({ name: 'internal_app_path', nullable: true })
  internal_app_path: string;

  @Column({ name: 'permission_model', nullable: true })
  permission_model: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  apis: string[];

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  workflow: string[];

  @Column({ type: 'integer', default: 1 })
  version: number;

  // Preserved client-side ID for migration deduplication.
  @Column({ name: 'client_id', nullable: true })
  client_id: string;

  @OneToMany(() => DAppBuilderAppAccess, (access) => access.app, { cascade: true })
  access_records: DAppBuilderAppAccess[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date;
}

export default DAppBuilderApp;
