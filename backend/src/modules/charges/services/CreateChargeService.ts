import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import CreateChargeTransactionService from '@modules/transactions/services/CreateChargeTransactionService';
import { inject, injectable, container } from 'tsyringe';
import Charge, {
  EnumMethod,
  EnumProcess,
} from '../infra/typeorm/entities/Charge';
import IChargesRepository from '../repositories/IChargesRepository';
import AppError from '@shared/errors/AppError';
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import CreateAuditLogService from '@modules/auditlogs/services/CreateAuditLogService';

interface IRequest {
  user_id: string;
  amount: number;
  sync_id?: string;
  organization_id?: string;
  method: EnumMethod;
}

@injectable()
class CreateChargeService {
  constructor(
    @inject('ChargesRepository')
    private chargesRepository: IChargesRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    user_id,
    amount,
    method,
    sync_id,
    organization_id,
  }: IRequest): Promise<Charge> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    let org_id = null;
    if (organization_id) {
      const organization = await this.organizationsRepository.findBySyncId(
        organization_id,
      );
      if (organization) {
        org_id = organization.id;
      }
    }

    const charge = await this.chargesRepository.create({
      amount,
      method,
      user_id: user.id,
      organization_id: org_id,
      process: EnumProcess.Completed,
    });

    const auditLogService = container.resolve(CreateAuditLogService);
    await auditLogService.execute({
      action: 'create',
      dapp: 'Charge',
      sync_id: sync_id,
      user_sync_id: user.sync_id,
      dapp_token: charge.id,
      dapp_token_sync_id: sync_id || charge.id,
      message: charge,
      outcome: 'success',
    });

    // create transaction with carge
    const createChargeTransaction = container.resolve(
      CreateChargeTransactionService,
    );
    const transaction = await createChargeTransaction.execute({
      amount,
      organization_id: org_id,
      charge_id: charge.id,
      to_user_id: user.id,
      sync_id,
    });

    // await auditLogService.execute({
    //   action: 'received',
    //   dapp: 'Transaction',
    //   sync_id: sync_id,
    //   user_sync_id: user.sync_id,
    //   dapp_token: transaction.id,
    //   dapp_token_sync_id: transaction.sync_id,
    //   outcome: 'success',
    // });

    return charge;
  }
}

export default CreateChargeService;
