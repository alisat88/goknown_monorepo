import DL from '../infra/typeorm/entities/DL';

export default interface IDLsRepository {
  findAll(): Promise<DL[]>;
  findAllBySyncId(dls_syncid?: string[]): Promise<DL[]>;
}
