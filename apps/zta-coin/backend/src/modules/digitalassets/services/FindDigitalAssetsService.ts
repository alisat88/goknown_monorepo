import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import IDigitalAssetsRepository from '../repositories/IDigitalAssetsRepository';
import { inject, injectable } from 'tsyringe';
import DigitalAsset, {
  EnumPrivacy,
} from '../infra/typeorm/entities/DigitalAsset';
import AppError from '@shared/errors/AppError';

@injectable()
class FindDigitalAssetsService {
  constructor(
    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  public async execute(
    sync_id: string,
    user_syncid: string,
  ): Promise<DigitalAsset | undefined> {
    const user = await this.usersRepository.findBySyncId(user_syncid);

    if (!user) {
      throw new AppError('User not found');
    }

    const digitalAssets = await this.digitalAssetsRepository.findBySyncId(
      sync_id,
    );

    if (!!digitalAssets && digitalAssets.privacy === EnumPrivacy.Private) {
      if (digitalAssets.user_id !== user.id) {
        throw new AppError('Forbidden', 403);
      }
    }

    if (!!digitalAssets && digitalAssets.user_id !== user.id) {
      digitalAssets.token = '';
    }

    return digitalAssets;
  }
}

export default FindDigitalAssetsService;
