import { inject, injectable } from 'tsyringe';
import IAuditLogsRepository from '../repositories/IAuditLogsRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { EnumRole } from '@modules/users/infra/typeorm/entities/User';

type IRequestDTO = {
  sync_user_id: string;
  filtered_user_syncid?: string;
  limit?: number;
  offset?: number;
  logType?: string;
};

@injectable()
class ListAllAuditLogsService {
  constructor(
    @inject('AuditLogsRepository')
    private auditLogsRepository: IAuditLogsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute({
    sync_user_id,
    filtered_user_syncid,
    limit = 30,
    offset = 0,
    logType = 'All',
  }: IRequestDTO): Promise<any> {
    const user = await this.usersRepository.findBySyncId(sync_user_id);
    if (!user) {
      throw new AppError('User not found 2');
    }

    if (user.role === EnumRole.Admin) {
      let filtered_user_id;
      if (filtered_user_syncid) {
        // console.log('AQUI', filtered_user_syncid);
        const filteredUser = await this.usersRepository.findBySyncId(
          filtered_user_syncid,
        );

        if (!filteredUser) {
          throw new AppError('User not found');
        }
        filtered_user_id = filteredUser.id;
      }

      const auditLogs = await this.auditLogsRepository.findAll({
        filtered_user_id,
        limit,
        offset,
        logType,
      });
      return auditLogs;
    }

    const auditLogs = await this.auditLogsRepository.findAllByUser(user.id);

    return auditLogs;
  }
}

export default ListAllAuditLogsService;
