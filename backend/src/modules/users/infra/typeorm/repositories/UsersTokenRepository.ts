import UserToken from '../entities/UserToken';
import { getRepository, Repository } from 'typeorm';

import IUsersTokensRepository from '@modules/users/repositories/IUsersTokensRepository';

class UserTokenRepository implements IUsersTokensRepository {
  private ormRepository: Repository<UserToken>;

  constructor() {
    this.ormRepository = getRepository(UserToken);
  }

  public async findByToken(token: string): Promise<UserToken | undefined> {
    const userToken = await this.ormRepository.findOne({ where: { token } });
    return userToken;
  }

  public async generate(user_id: string, token: string): Promise<UserToken> {
    const userToken = this.ormRepository.create({ user_id });
    if (token) {
      userToken.token = token;
    }
    await this.ormRepository.save(userToken);
    return userToken;
  }
}

export default UserTokenRepository;
