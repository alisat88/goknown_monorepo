import ICreateDigitalAssets from '../dtos/ICreateDigitalAssets';
import DigitalAsset from '../infra/typeorm/entities/DigitalAsset';

export interface IFindById {
  id: string;
  user_id: string;
}

export default interface IUsersRepository {
  findById(id: string): Promise<DigitalAsset | undefined>;
  findBySyncId(sync_id: string): Promise<DigitalAsset | undefined>;
  findAll(user_id: string): Promise<DigitalAsset[] | undefined>;
  findAllByRoomId(room_id: string): Promise<DigitalAsset[] | undefined>;
  findAllPublic(user_id: string): Promise<DigitalAsset[] | undefined>;
  findByToken(token: string): Promise<DigitalAsset | undefined>;
  create(data: ICreateDigitalAssets): Promise<DigitalAsset>;
  save(digitalAsset: DigitalAsset): Promise<DigitalAsset>;
}
