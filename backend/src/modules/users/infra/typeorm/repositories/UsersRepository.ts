import { getRepository, Repository, In, Raw } from 'typeorm';
import IUsersRepository, {
  IFindAll,
} from '@modules/users/repositories/IUsersRepository';
import User, { EnumRole, EnumStatus } from '../entities/User';
import ICreateUserDTO from '@modules/users/dtos/ICreateUserDTO';
class UsersRepository implements IUsersRepository {
  private ormRepository: Repository<User>;

  constructor() {
    this.ormRepository = getRepository(User);
  }

  public async findBySyncId(sync_id: string): Promise<User | undefined> {
    const user = await this.ormRepository.findOne({
      where: { sync_id },
    });

    // this.ormRepository.clear();
    return user;
  }

  public async findById(id: string): Promise<User | undefined> {
    const user = await this.ormRepository.findOne(id);
    return user;
  }

  public async findAll({
    status,
    name,
    sync_ids,
    limit = 30,
    offset = 0,
  }: IFindAll): Promise<User[] | undefined> {
    const inQuery = sync_ids ? { sync_id: In(sync_ids) } : null;
    const nameQuery = name
      ? {
          name: Raw(
            alias => `${alias} ILIKE '%${name}%' OR email ILIKE '%${name}%'`,
          ),
        }
      : null;

    const users = await this.ormRepository.find({
      where: {
        ...nameQuery,
        status: In(
          status || [
            EnumStatus.Active,
            EnumStatus.ConfirmEmail,
            EnumStatus.Pending,
            EnumStatus.Inactive,
          ],
        ),
        ...inQuery,
      },
      take: limit, // Define the number of records to retrieve (limit)
      skip: offset, // Define the starting position (offset)
    });

    return users;
  }

  public async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.ormRepository.findOne({
      where: { email: email.toLocaleLowerCase() },
    });
    return user;
  }

  public async findAllGroups(
    id: string,
    name?: string,
  ): Promise<User | undefined> {
    const user = await this.ormRepository.findOne({
      relations: ['groups', 'groups.owner'],
      where: { id },
    });

    if (user && name) {
      const filteredGroups = user.groups.filter(group =>
        group.name.toLocaleLowerCase().includes(name.toLocaleLowerCase()),
      );
      user.groups = filteredGroups;
    }

    return user;
  }

  // public async findAllORganizations(id: string): Promise<User | undefined> {
  //   throw new Error('Method not implemented.');
  // }

  public async findAllGroupsForms(
    id: string,
    name?: string,
  ): Promise<User | undefined> {
    const user = await this.ormRepository.findOne({
      relations: [
        'groups',
        'groups.owner',
        'groups.forms',
        'groups.forms.owner',
      ],
      where: { id },
    });

    if (user && name) {
      const filteredGroups = user.groups.filter(group =>
        group.name.toLocaleLowerCase().includes(name.toLocaleLowerCase()),
      );
      user.groups = filteredGroups;
    }

    return user;
  }

  public async findAllFolders(id: string): Promise<User | undefined> {
    const user = await this.ormRepository.findOne({
      relations: [
        'folders',
        'folders.owner',
        'folders.shared_users',
        'folders.shared_groups',
        'groups',
        'groups.folders',
        'groups.folders.owner',
        'groups.folders.shared_users',
        'groups.folders.shared_groups',
      ],
      where: { id },
    });

    return user;
  }

  public async create(userData: ICreateUserDTO): Promise<User> {
    const user = this.ormRepository.create({
      ...userData,
      email: userData.email.toLocaleLowerCase(),
    });

    await this.ormRepository.save(user);

    return user;
  }

  public async save(user: User): Promise<User> {
    return await this.ormRepository.save(user);
  }
}

export default UsersRepository;
