import ICreateDataFormsDTO from '../dtos/ICreateDataFormsDTO';
import DataForm from '../infra/typeorm/entities/DataForm';

export interface IFindById {
  id: string;
  user_id: string;
}

export default interface IFoldersRepository {
  findBySyncId(sync_id: string): Promise<DataForm | undefined>;
  findAllByRoomId(room_id: string): Promise<DataForm[] | undefined>;
  findAll(user_id: string): Promise<DataForm[]>;
  create(data: ICreateDataFormsDTO): Promise<DataForm>;
  save(dataform: DataForm): Promise<DataForm>;
  destroy(dataform: DataForm): Promise<void>;
}
