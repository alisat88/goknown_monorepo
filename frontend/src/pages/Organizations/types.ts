import { V4Options } from "uuid";

export interface IUser {
  id: string;
  sync_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: "inactive" | "active" | "pending";
}

export interface IGroupItem {
  id: string;
  name: string;
  sync_id: string;
  number_of_rooms: number;
  admin: IUser;
  rooms?: IRoomItem[];
}
export interface IDL {
  id: V4Options;
  name: string;
  icon: string;
  route: string;
  roles?: "admin" | "admin" | "buyer" | "seller" | "issuer";
  sync_id: string;
  icon_url?: string;
  oldPage?: string;
  externalUrl?: string;
  flag: string;
}

export interface IRoomItem {
  id: string;
  sync_id: string;
  name: string;
  group?: IGroupItem;
  dls: IDL[];
  members?: IOrganizationUserItem[];
  admin: IUser;
}

export interface IOrganizationItem {
  id: string;
  name: string;
  admin_alias: string;
  sync_id: string;
  file_path: string;
  avatar_url?: string;
  number_of_admins: number;
  number_of_members: number;
  enableWallet?: boolean;
  admins?: IUser[];
  owners?: IUser[];
  users?: IUser[];
  groups?: IGroupItem[];
}

export interface IOrganizationUserItem {
  id: string;
  user_id: string;
  user: IUser;
  organization_id: string;
  role: "owner" | "admin" | "user";
  status: "active" | "inactive" | "pending";
  organization: IOrganizationItem;
  number_of_admins: number;
  number_of_members: number;
}
