// src/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the IUserProgressRepository interface.
 * This class handles persistence operations for UserProgress entities.
 */

import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID } from '@/lib/constants'; // Used for default user initialization logic
import { STORE_USER_PROGRESS } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository'; // initDB is implicitly handled by performOperation

/**
 * @class IndexedDBUserProgressRepository
 * @implements {IUserProgressRepository}
 * @description Manages the persistence of {@link UserProgress} entities in IndexedDB.
 * It includes special logic in `findByUserId` to create a default progress record
 * if one doesn't exist for the `DEFAULT_USER_ID`.
 */
export class IndexedDBUserProgressRepository implements IUserProgressRepository {
  /**
   * Finds UserProgress by user ID.
   * If the `userId` is the `DEFAULT_USER_ID` and no progress is found,
   * it creates and saves a default progress record before returning it.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<UserProgress | null>} The found or created UserProgress, or null if not found for non-default users.
   */
  async findByUserId(userId: string): Promise<UserProgress | null> {
    const result = await performOperation<UserProgress | undefined>(
      STORE_USER_PROGRESS,
      'readonly',
      store => store.get(userId) // UserProgress store uses userId as keyPath
    );

    // Special handling for the default user: if no progress exists, create one.
    if (!result && userId === DEFAULT_USER_ID) {
      const defaultProgress: UserProgress = {
        userId: DEFAULT_USER_ID,
        points: 0,
        level: 1,
        unlockedCustomizations: []
      };
      // Save the newly created default progress. This same save method will use performOperation.
      await this.save(defaultProgress);
      return defaultProgress;
    }
    return result || null; // For non-default users, return null if not found.
  }

  /**
   * Saves UserProgress (creates or updates).
   * @param {UserProgress} userProgress - The UserProgress to save.
   * @returns {Promise<UserProgress>} The saved UserProgress.
   */
  async save(userProgress: UserProgress): Promise<UserProgress> {
    await performOperation(
      STORE_USER_PROGRESS,
      'readwrite',
      store => store.put(userProgress)
    );
    return userProgress;
  }

  /**
   * Clears all UserProgress from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(
      STORE_USER_PROGRESS,
      'readwrite',
      store => store.clear()
    );
  }
}
