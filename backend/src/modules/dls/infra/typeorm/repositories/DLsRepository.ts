import IDLsRepository from '@modules/dls/repositories/IDLsRepository';
import { getRepository, In, Repository } from 'typeorm';
import DL from '../entities/DL';

class DLsRepository implements IDLsRepository {
  private ormRepository: Repository<DL>;

  constructor() {
    this.ormRepository = getRepository(DL);
  }

  public async findAllBySyncId(dls_syncid: string[]): Promise<DL[]> {
    if (dls_syncid.length === 0) {
      return [];
    }
    // console.log(dls_syncid);
    const dls = this.ormRepository.find({
      where: { sync_id: In([...dls_syncid]) },
    });

    return dls;
  }

  public async findAll(): Promise<DL[]> {
    const dls = this.ormRepository.find();

    return dls;
  }
}

export default DLsRepository;
