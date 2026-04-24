import { EnumPrivacy } from '../infra/typeorm/entities/DigitalAsset';

export default interface ICreateDigitalAssets {
  name: string;
  description?: string;
  token?: string;
  mimetype: string;
  filename: string;
  user_id: string;
  sync_id: string;
  folder_id: string;
  shared: boolean;
  editable?: boolean;
  room_id?: string | null;
  privacy: EnumPrivacy;
}
