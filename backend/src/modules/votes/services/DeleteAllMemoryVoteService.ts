import IMemoryRedisProvider from '@shared/container/providers/MemoryRedisProvider/models/IMemoryRedisProvider';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';

@injectable()
class DeleteAllMemoryVoteService {
  constructor(
    // connection with memory db
    @inject('MemoryRedisProvider')
    private memoryProvider: IMemoryRedisProvider,
  ) {}

  public async execute(prefix: string): Promise<void> {
    try {
      await this.memoryProvider.invalidatePrefix(prefix);
    } catch (err) {
      // exception to create new error message
      throw new AppError(err.message);
    }
  }
}

export default DeleteAllMemoryVoteService;
