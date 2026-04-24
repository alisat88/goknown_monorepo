import ICreateDigitalAssets from '@modules/digitalassets/dtos/ICreateDigitalAssets';
import IDigitalAssetsRepository from '@modules/digitalassets/repositories/IDigitalAssetsRepository';
import { getRepository, Repository } from 'typeorm';
import DigitalAsset, { EnumPrivacy } from '../entities/DigitalAsset';

class DigitalAssetsRepository implements IDigitalAssetsRepository {
  private ormRepository: Repository<DigitalAsset>;

  constructor() {
    this.ormRepository = getRepository(DigitalAsset);
  }

  public async findById(id: string): Promise<DigitalAsset | undefined> {
    const digitalAsset = await this.ormRepository.findOne({
      relations: ['folder'],
      where: { id },
    });
    return digitalAsset;
  }

  public async findBySyncId(
    sync_id: string,
  ): Promise<DigitalAsset | undefined> {
    const digitalAsset = await this.ormRepository.findOne({
      relations: ['folder'],
      where: { sync_id },
    });
    return digitalAsset;
  }

  public async findAll(user_id: string): Promise<DigitalAsset[] | undefined> {
    const digigitalAssets = await this.ormRepository.find({
      where: { user_id },
      relations: ['folder'],
      order: { created_at: 'ASC' },
    });

    return digigitalAssets;
  }

  public async findAllByRoomId(
    room_id: string,
  ): Promise<DigitalAsset[] | undefined> {
    const digigitalAssets = await this.ormRepository.find({
      where: { room_id },
      relations: ['folder'],
      order: { created_at: 'ASC' },
    });

    return digigitalAssets;
  }

  public async findAllPublic(
    user_id: string,
  ): Promise<DigitalAsset[] | undefined> {
    const digitalAssets = await this.ormRepository.find({
      where: { privacy: EnumPrivacy.Public },
    });

    return digitalAssets.filter(dg => dg.user_id !== user_id);
  }

  public async findByToken(token: string): Promise<DigitalAsset | undefined> {
    const digitalAsset = await this.ormRepository.findOne({ where: { token } });
    return digitalAsset;
  }

  public async create(
    digitalAssetData: ICreateDigitalAssets,
  ): Promise<DigitalAsset> {
    const digitalAsset = this.ormRepository.create(digitalAssetData);

    await this.ormRepository.save(digitalAsset);

    return digitalAsset;
  }

  public async save(digitalAsset: DigitalAsset): Promise<DigitalAsset> {
    return await this.ormRepository.save(digitalAsset);
  }
}

export default DigitalAssetsRepository;
