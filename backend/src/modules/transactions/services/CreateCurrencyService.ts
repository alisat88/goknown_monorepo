import IOrganizationsRepository from '@modules/organizations/repositories/IOrganizationsRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import { EnumStatus } from '../infra/typeorm/entities/Currency';
import ICurrenciesRepository from '../repositories/ICurrenciesRepository';

interface IRequest {
  organization_id: string;
  enableWallet: boolean;
}

@injectable()
class CreateCurrencyService {
  constructor(
    @inject('CurrenciesRepository')
    private currenciesRepository: ICurrenciesRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
  ) {}

  public async execute({
    organization_id,
    enableWallet,
  }: IRequest): Promise<any> {
    const organization = await this.organizationsRepository.findById(
      organization_id,
    );
    if (!organization) {
      throw new AppError('Organization not found');
    }

    if (organization.enableWallet) {
      return null;
    }

    await this.currenciesRepository.create({
      organization_id,
      status: enableWallet ? EnumStatus.Active : EnumStatus.Inactive,
    });
  }
}

export default CreateCurrencyService;
