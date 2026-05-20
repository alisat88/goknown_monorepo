import Config from '../infra/typeorm/entities/Config';

export default interface IUsersRepository {
  findLast(): Promise<Config | undefined>;
}
