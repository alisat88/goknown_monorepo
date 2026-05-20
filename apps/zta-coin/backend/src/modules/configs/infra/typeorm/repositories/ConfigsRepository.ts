import IConfigsRepository from '@modules/configs/repositories/IConfigsRepository';
import { getRepository, Repository } from 'typeorm';
import Config from '../entities/Config';

export default class ConfigsRepository implements IConfigsRepository {
  private ormRepository: Repository<Config>;

  constructor() {
    this.ormRepository = getRepository(Config);
  }

  public async findLast(): Promise<Config | undefined> {
    const config = await this.ormRepository.findOne();
    return config;
  }
}
