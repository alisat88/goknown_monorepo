import ICreateAuditLogDTO from '../dtos/ICreateAuditLogDTO';
import IUpdateNodeDTO from '../dtos/IUpdateNodeDTO';
import AuditLog from '../infra/typeorm/entities/AuditLog';

export interface IFindAll {
  filtered_user_id?: string;
  limit?: number;
  offset?: number;
  logType?: string;
}

export default interface IAuditLogsRepository {
  findBySyncId(sync_id: string): Promise<AuditLog | undefined>;
  findBySyncIdAndDapp(
    sync_id: string,
    dapp: string,
  ): Promise<AuditLog | undefined>;

  findAllByUser(user_sync_id: string): Promise<AuditLog[] | undefined>;
  findAll({
    filtered_user_id,
    limit,
    offset,
    logType,
  }: IFindAll): Promise<AuditLog[] | undefined>;
  updateNodes(nodeData: IUpdateNodeDTO): Promise<void>;
  create(AuditLogData: ICreateAuditLogDTO): Promise<AuditLog>;
}
