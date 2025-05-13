// src/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository.stub.ts
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID } from '@/lib/constants';
// import { STORE_USER_PROGRESS } from '@/lib/constants';
// import { performOperation } from './indexeddb-base.repository';

export class IndexedDBUserProgressRepository implements IUserProgressRepository {
  async findByUserId(userId: string): Promise<UserProgress | null> {
    console.warn(`STUB: IndexedDBUserProgressRepository.findByUserId(${userId})`);
    // For testing settings page, return a default-like structure
    if (userId === DEFAULT_USER_ID) {
      return { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
    }
    return null;
  }
  async save(userProgress: UserProgress): Promise<UserProgress> {
    console.warn(`STUB: IndexedDBUserProgressRepository.save()`, userProgress);
    return userProgress;
  }
  async clearAll(): Promise<void> {
    console.warn(`STUB: IndexedDBUserProgressRepository.clearAll()`);
  }
}
