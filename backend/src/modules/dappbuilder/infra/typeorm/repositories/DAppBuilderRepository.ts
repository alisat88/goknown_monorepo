import { getRepository, Repository } from 'typeorm';
import IDAppBuilderRepository, {
  ICreateAppDTO,
  IUpdateAppDTO,
} from '@modules/dappbuilder/repositories/IDAppBuilderRepository';
import DAppBuilderApp from '../entities/DAppBuilderApp';
import DAppBuilderAppAccess from '../entities/DAppBuilderAppAccess';

class DAppBuilderRepository implements IDAppBuilderRepository {
  private get repo(): Repository<DAppBuilderApp> {
    return getRepository(DAppBuilderApp);
  }

  private get accessRepo(): Repository<DAppBuilderAppAccess> {
    return getRepository(DAppBuilderAppAccess);
  }

  public async findById(id: string): Promise<DAppBuilderApp | undefined> {
    return this.repo.findOne({
      where: { id },
      relations: ['owner', 'access_records', 'access_records.user'],
    });
  }

  public async findByOwner(ownerId: string): Promise<DAppBuilderApp[]> {
    return this.repo.find({
      where: { owner_id: ownerId },
      relations: ['owner', 'access_records', 'access_records.user'],
      order: { created_at: 'DESC' },
    });
  }

  public async findSharedWithUser(userId: string): Promise<DAppBuilderApp[]> {
    const accessRecords = await this.accessRepo.find({
      where: { user_id: userId },
      relations: [
        'app',
        'app.owner',
        'app.access_records',
        'app.access_records.user',
      ],
    });
    // Filter out soft-deleted apps
    return accessRecords
      .map((r) => r.app)
      .filter((app) => app && !app.deleted_at);
  }

  public async findByClientId(
    clientId: string,
    ownerId: string,
  ): Promise<DAppBuilderApp | undefined> {
    return this.repo.findOne({ where: { client_id: clientId, owner_id: ownerId } });
  }

  public async create(data: ICreateAppDTO): Promise<DAppBuilderApp> {
    const app = this.repo.create({
      ...data,
      apis: data.apis ?? [],
      workflow: data.workflow ?? [],
      version: data.version ?? 1,
    });
    return this.repo.save(app);
  }

  public async save(app: DAppBuilderApp): Promise<DAppBuilderApp> {
    return this.repo.save(app);
  }

  public async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  public async findAccess(
    appId: string,
    userId: string,
  ): Promise<DAppBuilderAppAccess | undefined> {
    return this.accessRepo.findOne({ where: { app_id: appId, user_id: userId } });
  }

  public async upsertAccess(
    appId: string,
    userId: string,
    role: string,
  ): Promise<DAppBuilderAppAccess> {
    let record = await this.findAccess(appId, userId);
    if (record) {
      record.role = role;
      return this.accessRepo.save(record);
    }
    record = this.accessRepo.create({ app_id: appId, user_id: userId, role });
    return this.accessRepo.save(record);
  }

  public async removeAccess(appId: string, userId: string): Promise<void> {
    await this.accessRepo.delete({ app_id: appId, user_id: userId });
  }
}

export default DAppBuilderRepository;
