import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import { addHours, isAfter } from 'date-fns';
import { EnumStatus } from '../infra/typeorm/entities/User';
import IUsersRepository from '../repositories/IUsersRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';

interface IRequest {
  pin: string;
  email: string;
}

@injectable()
class ConfirmUserService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('HashProvider')
    private hashProvider: IHashProvider,
  ) {}

  public async execute({ pin, email }: IRequest): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Incorrect email/pin', 401);
    }

    if (!user.pin) {
      throw new AppError('User pin does not exists, prease resend new pin');
    }

    const pinMatched = await this.hashProvider.compareHash(pin, user.pin);

    if (!pinMatched) {
      throw new AppError('Incorrect email/pin.', 401);
    }

    const pinCreatedAt = user.pin_created_at;
    if (!pinCreatedAt) {
      throw new AppError('User pin does not exists, prease resend new pin');
    }

    const compareDate = addHours(pinCreatedAt, 2);
    if (isAfter(Date.now(), compareDate)) {
      throw new AppError('Pin expired, prease resend new pin');
    }

    user.status = EnumStatus.Active;
    user.pin_created_at = null;
    user.pin = '';

    this.usersRepository.save(user);
  }
}

export default ConfirmUserService;
