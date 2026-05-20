import UserToken from '../infra/typeorm/entities/UserToken';

export default interface IUsersTokensRepository {
  generate(user_id: string, token?: string): Promise<UserToken>;
  findByToken(token: string): Promise<UserToken | undefined>;
}
