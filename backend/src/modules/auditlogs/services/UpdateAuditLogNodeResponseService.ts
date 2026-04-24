import { inject, injectable } from 'tsyringe';
import IAuditLogsRepository from '../repositories/IAuditLogsRepository';
import AppError from '@shared/errors/AppError';

type IRequest = {
  dapp_token_sync_id: string;
  outcome: 'success' | 'error';
  message?: any;
  node: string;
  dapp?: string;
};

@injectable()
class UpdateAuditLogNodeResponseService {
  constructor(
    @inject('AuditLogsRepository')
    private auditLogsRepository: IAuditLogsRepository,
  ) {}

  public async execute({
    dapp_token_sync_id,
    message,
    node,
    outcome,
    dapp,
  }: IRequest): Promise<void> {
    const auditLog = await this.auditLogsRepository.findBySyncId(
      dapp_token_sync_id,
    );

    if (!auditLog) {
      throw new AppError('Auditlog no found');
    }

    await this.auditLogsRepository.updateNodes({
      dapp_token_sync_id,
      node,
      outcome,
      message,
      dapp,
    });
  }
}

export default UpdateAuditLogNodeResponseService;
