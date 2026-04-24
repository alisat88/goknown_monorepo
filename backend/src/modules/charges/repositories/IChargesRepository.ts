import ICreateChargeDTO from '../dtos/ICreateChargeDTO';
import Charge from '../infra/typeorm/entities/Charge';

export default interface IChargesRepository {
  findById(charge_id: string): Promise<Charge | undefined>;
  findLatestCharges(
    user_id: string,
    organization_id?: string,
  ): Promise<Charge[] | undefined>;
  create(chargeData: ICreateChargeDTO): Promise<Charge>;
}
