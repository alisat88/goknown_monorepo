import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';
import { inject, injectable } from 'tsyringe';
import DigitalAsset from '../infra/typeorm/entities/DigitalAsset';
import AppError from '@shared/errors/AppError';

@injectable()
class ListUserDigitalAssetsService {
  constructor(
    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(user_id: string): Promise<DigitalAsset[] | undefined> {
    const user = await this.usersRepository.findBySyncId(user_id);
    if (!user) {
      throw new AppError('User not found');
    }

    const digitalAssets = await this.digitalAssetsRepository.findAll(user.id);

    return digitalAssets;
  }
}

export default ListUserDigitalAssetsService;
