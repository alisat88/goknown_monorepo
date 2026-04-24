import DataForm from '@modules/dataforms/infra/typeorm/entities/DataForm';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';

import IDataFormsRepository from '@modules/dataforms/repositories/IDataFormsRepository';
import IOrganizationsRepository from '../repositories/IOrganizationsRepository';
import IOrganizationsUsersRepository from '../repositories/IOrganizationsUsersRepository';
import {
  EnumRole,
  EnumStatus,
} from '../infra/typeorm/entities/OrganizationUser';
import IRoomsRepository from '../repositories/IRoomsRepository';

interface IRequest {
  user_syncid: string;
  room_syncid: string;
  organization_syncid: string;
}

@injectable()
class ListAllDataFormsService {
  constructor(
    @inject('DataFormsRepository')
    private dataFormsRepository: IDataFormsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('OrganizationsUsersRepository')
    private organizationsUsersRepository: IOrganizationsUsersRepository,
    @inject('OrganizationsRoomsRepository')
    private organizationsRoomsRepository: IRoomsRepository,
  ) {}

  public async execute({
    user_syncid,
    room_syncid,
    organization_syncid,
  }: IRequest): Promise<DataForm[]> {
    const user = await this.usersRepository.findBySyncId(user_syncid);
    if (!user) {
      throw new AppError('User not found');
    }

    // find organization
    const organization = await this.organizationsRepository.findBySyncId(
      organization_syncid,
    );

    if (!organization) {
      throw new AppError('Organization not found');
    }

    const organizationsUsers =
      await this.organizationsUsersRepository.findAllUsersByOrganization({
        organization_id: organization.id,
        roles: [EnumRole.Admin, EnumRole.User, EnumRole.Owner],
        status: [EnumStatus.Active, EnumStatus.Pending],
      });

    const isOrganizationUser = !!organizationsUsers.find(
      orgUser => orgUser.user_id === user.id,
    );

    if (!isOrganizationUser) {
      throw new AppError('Unauthorized');
    }

    const room = await this.organizationsRoomsRepository.findBySyncId(
      room_syncid,
    );

    if (!room) {
      throw new AppError('Room not found');
    }

    const dataforms = await this.dataFormsRepository.findAllByRoomId(room.id);

    return dataforms || [];
  }
}

export default ListAllDataFormsService;
