import ICreateCurrencyDTO from '@modules/transactions/dtos/ICreateCurrencyDTO';
import ICurrenciesRepository from '@modules/transactions/repositories/ICurrenciesRepository';
import { getRepository, Repository } from 'typeorm';
import Currency from '../entities/Currency';

class CurrenciesRepository implements ICurrenciesRepository {
  private ormRepository: Repository<Currency>;

  constructor() {
    this.ormRepository = getRepository(Currency);
  }

  public async findByOrganizationId(
    organization_id: string,
  ): Promise<Currency | undefined> {
    const currency = await this.ormRepository.find({
      where: { organization_id },
      order: { created_at: 'ASC' },
      take: 1,
    });

    return currency[0];
  }

  public async findBySyncId(sync_id: string): Promise<Currency | undefined> {
    const currency = await this.ormRepository.findOne({
      where: { sync_id },
    });

    return currency;
  }

  public async findById(id: string): Promise<Currency | undefined> {
    const currency = await this.ormRepository.findOne({
      where: { id },
    });

    return currency;
  }

  public async create(data: ICreateCurrencyDTO): Promise<Currency> {
    const organization = this.ormRepository.create(data);

    await this.ormRepository.save(organization);

    return organization;
  }

  public async save(currencyData: Currency): Promise<Currency> {
    const currency = this.ormRepository.create(currencyData);

    await this.ormRepository.save(currency);

    return currency;
  }
}

export default CurrenciesRepository;
