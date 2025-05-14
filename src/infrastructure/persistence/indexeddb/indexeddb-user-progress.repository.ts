// src/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository.ts
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { STORE_USER_PROGRESS, DEFAULT_USER_ID } from '@/lib/constants';
import { performOperation, initDB } from './indexeddb-base.repository';

export class IndexedDBUserProgressRepository implements IUserProgressRepository {
  async findByUserId(userId: string): Promise<UserProgress | null> {
    const result = await performOperation<UserProgress | undefined>(STORE_USER_PROGRESS, 'readonly', store => store.get(userId));
    if (!result && userId === DEFAULT_USER_ID) {
      // If default user has no progress, create and save a default one.
      const defaultProgress: UserProgress = { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
      await this.save(defaultProgress);
      return defaultProgress;
    }
    return result || null;
  }

  async save(userProgress: UserProgress): Promise<UserProgress> {
    await performOperation(STORE_USER_PROGRESS, 'readwrite', store => store.put(userProgress));
    return userProgress;
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_USER_PROGRESS, 'readwrite', store => store.clear());
  }
}
