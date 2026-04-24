import { inject, injectable } from 'tsyringe';
import DL from '../infra/typeorm/entities/DL';
import IDLsRepository from '../repositories/IDLsRepository';

@injectable()
class ListAllDLsService {
  constructor(
    @inject('DLsRepository')
    private dlsRepository: IDLsRepository,
  ) {}

  public async execute(): Promise<DL[]> {
    const dls = await this.dlsRepository.findAll();

    return dls;
  }
}

export default ListAllDLsService;
