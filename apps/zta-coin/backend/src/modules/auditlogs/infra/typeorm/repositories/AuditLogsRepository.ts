import { getRepository, Repository } from 'typeorm';
import IAuditLogsRepository, {
  IFindAll,
} from '@modules/auditlogs/repositories/IAuditLogsRepository';
import AuditLog from '../entities/AuditLog';
import ICreateAuditLogDTO from '@modules/auditlogs/dtos/ICreateAuditLogDTO';
import Node from '../entities/Node';
import IUpdateNodeDTO from '@modules/auditlogs/dtos/IUpdateNodeDTO';

type IFilter = {
  user_id?: string;
  dapp?: string;
};

class AuditLogsRepository implements IAuditLogsRepository {
  private ormRepository: Repository<AuditLog>;

  constructor() {
    this.ormRepository = getRepository(AuditLog);
  }

  public filterUniqueNodes(nodes: Node[]): Node[] {
    const uniqueNodeNames: string[] = [];
    const uniqueNodes: Node[] = [];

    for (const node of nodes) {
      if (!uniqueNodeNames.includes(node.node)) {
        uniqueNodeNames.push(node.node);
        uniqueNodes.push(node);
      }
    }

    return uniqueNodes;
  }

  public async findAll({
    filtered_user_id,
    limit = 30,
    offset = 0,
    logType = 'All',
  }: IFindAll): Promise<AuditLog[]> {
    // Inicializa o array de condições do filtro
    const filterConditions = [];

    // Condição para user_id se fornecido
    if (filtered_user_id) {
      filterConditions.push({ user_id: filtered_user_id });
    }

    // Condição para logType (dapp) se diferente de 'All'
    if (logType !== 'All') {
      filterConditions.push({ dapp: logType });
    }

    // Faz a busca no repositório com os filtros aplicados
    const logs = await this.ormRepository.find({
      relations: ['user'],
      where: filterConditions.length > 0 ? filterConditions : undefined,
      order: { created_at: 'DESC' },
      take: limit, // Define o limite de registros
      skip: offset, // Define o ponto de início
    });

    // Mapeia os logs retornados e aplica a filtragem de nós
    return logs.map(log => ({
      ...log,
      nodes: this.filterUniqueNodes(log.nodes),
    }));
  }

  public async findAllByUser(user_id: string): Promise<AuditLog[]> {
    const logs = await this.ormRepository.find({
      relations: ['user'],
      where: {
        user_id,
      },
    });
    return logs.map(log => ({
      ...log,
      nodes: this.filterUniqueNodes(log.nodes),
    }));
  }

  public async findBySyncId(sync_id: string): Promise<AuditLog | undefined> {
    const logs = await this.ormRepository.findOne({ where: { sync_id } });
    return logs;
  }

  public async findBySyncIdAndDapp(
    sync_id: string,
    dapp: string,
  ): Promise<AuditLog | undefined> {
    const logs = await this.ormRepository.findOne({ where: { sync_id, dapp } });
    return logs;
  }

  public async create(data: ICreateAuditLogDTO): Promise<AuditLog> {
    const {
      sync_id,
      action,
      dapp,
      dapp_token,
      dapp_token_sync_id,
      leader_node,
      user_id,
      message,
    } = data;

    const now = new Date().toISOString();
    const newMessage: any = {
      node: process.env.NODE_NAME,
      outcome: data.outcome,
      message,
      created_at: now,
    };

    const nodesJSON = JSON.stringify([newMessage]);

    await this.ormRepository
      .createQueryBuilder()
      .insert()
      .into(AuditLog)
      .values({
        sync_id,
        action,
        dapp,
        dapp_token,
        dapp_token_sync_id,
        leader_node,
        user_id,
      })
      .execute();

    const auditLog = await this.ormRepository
      .createQueryBuilder()
      .update(AuditLog)
      .set({
        nodes: () =>
          `nodes || ARRAY(SELECT jsonb_array_elements_text('${nodesJSON}')::jsonb)`,
      })
      .where('sync_id = :sync_id', { sync_id: sync_id })
      .execute();

    return auditLog.raw;
  }

  public async updateNodes({
    dapp_token_sync_id,
    node,
    outcome,
    message,
    dapp,
  }: IUpdateNodeDTO): Promise<void> {
    const now = new Date().toISOString();
    const newNode: Node = {
      node,
      outcome,
      message,
      created_at: now,
    };

    if (node === process.env.NODE_ENV) {
      return;
    }

    const nodeJSON = JSON.stringify([newNode]);

    const queryBuilder = this.ormRepository
      .createQueryBuilder()
      .update(AuditLog)
      .set({
        nodes: () =>
          `nodes || ARRAY(SELECT jsonb_array_elements_text('${nodeJSON}')::jsonb)`,
      })
      .where('dapp_token_sync_id = :dapp_token_sync_id', {
        dapp_token_sync_id,
      });

    if (dapp) {
      queryBuilder.andWhere('dapp = :dapp', { dapp });
    }

    await queryBuilder.execute();
  }
}

export default AuditLogsRepository;
