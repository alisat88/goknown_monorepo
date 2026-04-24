/* eslint-disable @typescript-eslint/no-unused-vars */
import { inject, injectable } from 'tsyringe';
import Transaction from '../infra/typeorm/entities/Transaction';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import ITransactionsRepository from '../repositories/ITransactionsRepository';
import AppError from '@shared/errors/AppError';
import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';

interface IRequest {
  user_id: string;
  organizationId?: string;
}

interface IResponse {
  transactions: Transaction[] | undefined;
  current_balance: number;
}

@injectable()
class ListLatestTransactionsService {
  constructor(
    @inject('TransactionsRepository')
    private transactionsRepository: ITransactionsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    user_id,
    organizationId,
  }: IRequest): Promise<IResponse> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    let organization_id = null;
    if (organizationId) {
      const organization = await this.organizationsRepository.findBySyncId(
        organizationId,
      );
      if (organization) {
        organization_id = organization.id;
      }
    }

    const current_balance = await this.transactionsRepository.findBalance(
      user.id,
      organization_id,
    );

    const transactions =
      await this.transactionsRepository.findLatestTransactions(
        user.id,
        organization_id,
      );

    return { transactions, current_balance };
  }
}

export default ListLatestTransactionsService;
