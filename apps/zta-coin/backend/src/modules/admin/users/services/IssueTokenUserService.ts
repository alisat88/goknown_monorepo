import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';
import {
  EnumMethod,
  EnumProcess,
} from '@modules/charges/infra/typeorm/entities/Charge';
import IChargesRepository from '@modules/charges/repositories/IChargesRepository';
import CreateChargeTransactionService from '@modules/transactions/services/CreateChargeTransactionService';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { container, inject, injectable } from 'tsyringe';

type IRequestDTO = {
  amount: number;
  password: string;
  sync_user_id: string;
  logged_user_sync_id: string;
};

@injectable()
class IssueTokenUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('ChargesRepository')
    private chargesRepository: IChargesRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider,
  ) {}

  public async execute({
    amount,
    password,
    sync_user_id,
    logged_user_sync_id,
  }: IRequestDTO): Promise<void> {
    const loggedUser = await this.usersRepository.findBySyncId(
      logged_user_sync_id,
    );

    if (!loggedUser) {
      throw new AppError('Logged User not found');
    }

    const user = await this.usersRepository.findBySyncId(sync_user_id);

    if (!user) {
      throw new AppError('User not found');
    }

    const passwordMatched = await this.hashProvider.compareHash(
      password,
      loggedUser.password,
    );

    if (!passwordMatched) {
      throw new AppError('Unauthorized', 401);
    }

    const charge = await this.chargesRepository.create({
      amount,
      method: EnumMethod.Fake,
      user_id: user.id,
      process: EnumProcess.Completed,
    });

    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'create',
      dapp: 'Charge',
      sync_id: sync_user_id,
      user_sync_id: user.sync_id,
      dapp_token: charge.id,
      dapp_token_sync_id: sync_user_id || charge.id,
      message: charge,
      outcome: 'success',
    });

    const createChargeTransaction = container.resolve(
      CreateChargeTransactionService,
    );
    await createChargeTransaction.execute({
      amount,
      charge_id: charge.id,
      to_user_id: user.id,
      sync_id: user.sync_id,
    });
  }
}

export default IssueTokenUserService;
