import { inject, injectable } from 'tsyringe';
import AuditLog from '../infra/typeorm/entities/AuditLog';
import IAuditLogsRepository from '../repositories/IAuditLogsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  user_sync_id: string;
  sync_id?: string;
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'send'
    | 'received'
    | 'login'
    | 'logout'
    | 'error';
  dapp: string;
  outcome: 'success' | 'error';
  dapp_token: string;
  message?: any;
  dapp_token_sync_id: string;
}

@injectable()
class CreateAuditLogService {
  constructor(
    @inject('AuditLogsRepository')
    private auditLogsRepository: IAuditLogsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    user_sync_id,
    sync_id,
    action,
    dapp,
    dapp_token,
    dapp_token_sync_id,
    outcome,
    message,
  }: IRequest): Promise<AuditLog> {
    const user = await this.usersRepository.findBySyncId(user_sync_id);
    if (!user) {
      throw new AppError('User not found');
    }

    try {
      const auditLog = await this.auditLogsRepository.create({
        user_id: user.id,
        action,
        dapp,
        sync_id,
        dapp_token,
        dapp_token_sync_id,
        outcome: outcome,
        message,
        leader_node: process.env.NODE_NAME || 'unknown',
      });

      return auditLog;
    } catch (e) {
      console.log(e);
      throw new AppError('Error');
    }

    return auditLog;
  }
}

export default CreateAuditLogService;
