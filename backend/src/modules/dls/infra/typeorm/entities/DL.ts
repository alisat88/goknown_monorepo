import Room from '@modules/organizations/infra/typeorm/entities/Room';
import { Expose } from 'class-transformer';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import uploadConfig from '@config/upload';

@Entity('dls')
class DL {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sync_id: string;

  @Column()
  name: string;

  @Column()
  flag: string;

  @Column()
  icon: string;

  @Column()
  route: string;

  @ManyToMany(() => Room, room => room.dls)
  rooms: Room[];

  @ManyToMany(() => DL, dl => dl.rooms)
  dls?: DL[];

  @Expose({ name: 'icon_url' })
  getAvatarUrl(): string | null {
    if (!this.icon) {
      return null;
    }

    switch (uploadConfig.driver) {
      case 'disk':
        return this.icon
          ? `${process.env.APP_API_URL}/files/${this.icon}`
          : null;
      case 's3':
        return `https://${uploadConfig.config.aws.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${this.icon}`;
      case 'digitalocean':
        return `${process.env.DO_SPACE_URL}/dls/${this.icon}`;
      default:
        return null;
    }
  }
}

export default DL;
