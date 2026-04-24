import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configs')
class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enableCreateUser: boolean;
}

export default Config;
