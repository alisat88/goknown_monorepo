import User from '@modules/users/infra/typeorm/entities/User';
import ICreateRoomDTO from '../dtos/ICreateRoomDTO';
import Room from '../infra/typeorm/entities/Room';

export default interface IRoomsRepository {
  findBySyncId(sync_id: string): Promise<Room | undefined>;
  findAllMembers(sync_id: string): Promise<User[]>;
  create(data: ICreateRoomDTO): Promise<Room>;
  save(data: Room): Promise<Room>;
}
