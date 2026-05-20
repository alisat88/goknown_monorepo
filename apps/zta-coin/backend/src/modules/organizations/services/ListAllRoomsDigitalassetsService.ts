import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import { inject, injectable } from 'tsyringe';
import AppError from '@shared/errors/AppError';
import DigitalAsset from '@modules/digitalassets/infra/typeorm/entities/DigitalAsset';
import IDigitalAssetsRepository from '@modules/digitalassets/repositories/IDigitalAssetsRepository';
import IRoomsRepository from '../repositories/IRoomsRepository';

@injectable()
class ListAllRoomsDigitalassetsService {
  constructor(
    @inject('DigitalAssetsRepository')
    private digitalAssetsRepository: IDigitalAssetsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute(
    room_syncid: string,
  ): Promise<DigitalAsset[] | undefined> {
    // const user = await this.usersRepository.findBySyncId(user_id);
    // if (!user) {
    //   throw new AppError('User not found');
    // }

    const room = await this.organizationsRoomsRepository.findBySyncId(
      room_syncid,
    );

    if (!room) {
      throw new AppError('Room not found');
    }

    const digitalAssets = await this.digitalAssetsRepository.findAllByRoomId(
      room.id,
    );

    return digitalAssets;
  }
}

export default ListAllRoomsDigitalassetsService;
