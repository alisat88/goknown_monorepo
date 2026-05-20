import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import uploadConfig from '@config/upload';

import { Exclude, Expose } from 'class-transformer';
import Folder from '@modules/digitalassets/infra/typeorm/entities/Folder';
import Group from '@modules/groups/infra/typeorm/entities/Group';

export enum EnumRole {
  Admin = 'admin',
  Buyer = 'buyer',
  Seller = 'seller',
  issuer = 'issuer',
}

export enum EnumStatus {
  Active = 'active',
  ConfirmEmail = 'confirm_email',
  Inactive = 'inactive',
  Pending = 'pending',
}

// entity view
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  // add nullable
  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  twoFactorAuthentication: boolean;

  @Exclude()
  @Column({ nullable: true })
  twoFactorAuthenticationCode: string;

  @Column({
    type: 'enum',
    enum: EnumRole,
    default: EnumRole.Buyer,
  })
  role: EnumRole;

  @Column({
    type: 'enum',
    enum: EnumStatus,
    default: EnumStatus.ConfirmEmail,
  })
  status: EnumStatus;

  @Column({ nullable: true })
  pin: string;

  @Column({ nullable: true })
  sync_id: string;

  @Exclude()
  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  pin_created_at?: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => User, user => user.recipienting)
  @JoinTable({
    name: 'recipients',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'recipient_id',
      referencedColumnName: 'id',
    },
  })
  recipient: User[];

  @ManyToMany(() => Folder, folder => folder.shared_users)
  folders: Folder[];

  @ManyToMany(() => Group, group => group.shared_users)
  groups: Group[];

  // @ManyToMany(() => Room, room => room.)
  // rooms: Room[];

  // @ManyToMany(() => OrganizationUser, organizationUser => organizationUser.users)
  // organizations: Organization[];

  @ManyToMany(_type => User, user => user.recipient)
  recipienting: User[];

  @Expose({ name: 'avatar_url' })
  getAvatarUrl(): string | null {
    if (!this.avatar) {
      return null;
    }

    switch (uploadConfig.driver) {
      case 'disk':
        return this.avatar
          ? `${process.env.APP_API_URL}/files/${this.avatar}`
          : null;
      case 's3':
        return `https://${uploadConfig.config.aws.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${this.avatar}`;
      case 'digitalocean':
        return `${process.env.DO_SPACE_URL}/avatars/${this.avatar}`;
      default:
        return null;
    }
  }

  @Expose({ name: 'hasTwoFactorCode' })
  getHasTwoFactorCode(): boolean {
    // if 2fa google use towFactorAuthenticationCode
    // return !!this.twoFactorAuthenticationCode;
    return !!this.phone;
  }
}

export default User;
