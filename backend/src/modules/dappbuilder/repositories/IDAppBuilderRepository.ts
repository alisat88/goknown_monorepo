import DAppBuilderApp from '../infra/typeorm/entities/DAppBuilderApp';
import DAppBuilderAppAccess from '../infra/typeorm/entities/DAppBuilderAppAccess';

export interface ICreateAppDTO {
  owner_id: string;
  dapp_name: string;
  description?: string;
  user_prompt?: string;
  template?: string;
  status?: string;
  generated_code?: string;
  generated_config?: string;
  internal_app_path?: string;
  permission_model?: string;
  apis?: string[];
  workflow?: string[];
  version?: number;
  client_id?: string;
}

export interface IUpdateAppDTO {
  dapp_name?: string;
  description?: string;
  user_prompt?: string;
  template?: string;
  status?: string;
  generated_code?: string;
  generated_config?: string;
  internal_app_path?: string;
  permission_model?: string;
  apis?: string[];
  workflow?: string[];
  version?: number;
}

export default interface IDAppBuilderRepository {
  findById(id: string): Promise<DAppBuilderApp | undefined>;
  findByOwner(ownerId: string): Promise<DAppBuilderApp[]>;
  findSharedWithUser(userId: string): Promise<DAppBuilderApp[]>;
  findByClientId(clientId: string, ownerId: string): Promise<DAppBuilderApp | undefined>;
  create(data: ICreateAppDTO): Promise<DAppBuilderApp>;
  save(app: DAppBuilderApp): Promise<DAppBuilderApp>;
  softDelete(id: string): Promise<void>;

  findAccess(appId: string, userId: string): Promise<DAppBuilderAppAccess | undefined>;
  upsertAccess(appId: string, userId: string, role: string): Promise<DAppBuilderAppAccess>;
  removeAccess(appId: string, userId: string): Promise<void>;
}
