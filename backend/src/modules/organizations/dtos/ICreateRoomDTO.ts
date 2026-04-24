import DL from '@modules/dls/infra/typeorm/entities/DL';

export default interface ICreateRoomDTO {
  name: string;
  sync_id: string;
  admin_id: string;
  group_id: string;
  dls?: DL[];
}
