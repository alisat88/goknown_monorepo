/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
