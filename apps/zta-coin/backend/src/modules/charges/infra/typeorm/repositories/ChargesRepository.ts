import { getRepository, Repository } from 'typeorm';
import IChargesRepository from '@modules/charges/repositories/IChargesRepository';
import Charge from '../entities/Charge';
import ICreateChargeDTO from '@modules/charges/dtos/ICreateChargeDTO';
class ChargesRepository implements IChargesRepository {
  private ormRepository: Repository<Charge>;

  constructor() {
    this.ormRepository = getRepository(Charge);
  }

  public async findById(id: string): Promise<Charge | undefined> {
    const user = await this.ormRepository.findOne(id);
    return user;
  }

  public async findLatestCharges(
    user_id: string,
    organization_id?: string,
  ): Promise<Charge[] | undefined> {
    const charge = await this.ormRepository.find({
      where: { user_id, organization_id },
      take: 10,
      order: {
        created_at: 'DESC',
      },
    });

    return charge;
  }

  public async create(chargeData: ICreateChargeDTO): Promise<Charge> {
    const charge = this.ormRepository.create(chargeData);

    await this.ormRepository.save(charge);

    return charge;
  }
}

export default ChargesRepository;
