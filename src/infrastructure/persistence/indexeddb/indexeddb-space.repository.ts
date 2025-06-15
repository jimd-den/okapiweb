// src/infrastructure/persistence/indexeddb/indexeddb-space.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the ISpaceRepository interface.
 * This class handles persistence operations for Space entities.
 */

import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import { STORE_SPACES } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository';

/**
 * @class IndexedDBSpaceRepository
 * @implements {ISpaceRepository}
 * @description Manages the persistence of {@link Space} entities in IndexedDB.
 * It utilizes the generic `performOperation` for database interactions.
 */
export class IndexedDBSpaceRepository implements ISpaceRepository {
  /**
   * Finds a Space by its unique ID.
   * @param {string} id - The ID of the Space to find.
   * @returns {Promise<Space | null>} The found Space or null.
   */
  async findById(id: string): Promise<Space | null> {
    const result = await performOperation<Space | undefined>(
      STORE_SPACES,
      'readonly',
      store => store.get(id)
    );
    return result || null;
  }

  /**
   * Retrieves all Spaces from the store.
   * @returns {Promise<Space[]>} An array of all Spaces.
   */
  async getAll(): Promise<Space[]> {
    const result = await performOperation<Space[]>(
      STORE_SPACES,
      'readonly',
      store => store.getAll()
    );
    return result || [];
  }

  /**
   * Saves a Space (creates or updates).
   * @param {Space} space - The Space to save.
   * @returns {Promise<Space>} The saved Space.
   */
  async save(space: Space): Promise<Space> {
    await performOperation(
      STORE_SPACES,
      'readwrite',
      store => store.put(space)
    );
    return space;
  }

  /**
   * Deletes a Space by its ID.
   * @param {string} id - The ID of the Space to delete.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await performOperation(
      STORE_SPACES,
      'readwrite',
      store => store.delete(id)
    );
  }
  
  /**
   * Clears all Spaces from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(
      STORE_SPACES,
      'readwrite',
      store => store.clear()
    );
  }
}
