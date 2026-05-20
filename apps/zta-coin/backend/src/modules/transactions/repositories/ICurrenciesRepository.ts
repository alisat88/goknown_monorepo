import ICreateCurrencyDTO from '../dtos/ICreateCurrencyDTO';
import Currency from '../infra/typeorm/entities/Currency';

export default interface ICurrenciesRepository {
  findById(id: string): Promise<Currency | undefined>;
  findBySyncId(sync_id: string): Promise<Currency | undefined>;
  findByOrganizationId(organization_id: string): Promise<Currency | undefined>;
  create(data: ICreateCurrencyDTO): Promise<Currency>;
  save(data: Currency): Promise<Currency>;
}
