// src/infrastructure/persistence/indexeddb/indexeddb-problem.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the IProblemRepository interface.
 * This class handles persistence operations for Problem entities.
 */

import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import { STORE_PROBLEMS } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository';

/**
 * @class IndexedDBProblemRepository
 * @implements {IProblemRepository}
 * @description Manages the persistence of {@link Problem} entities in IndexedDB.
 * It utilizes the generic `performOperation` for database interactions.
 */
export class IndexedDBProblemRepository implements IProblemRepository {
  /**
   * Finds a Problem by its unique ID.
   * @param {string} id - The ID of the Problem to find.
   * @returns {Promise<Problem | null>} The found Problem or null.
   */
  async findById(id: string): Promise<Problem | null> {
    const result = await performOperation<Problem | undefined>(
      STORE_PROBLEMS,
      'readonly',
      (store) => store.get(id)
    );
    return result || null;
  }

  /**
   * Finds all Problems for a given space ID.
   * Results are sorted with unresolved problems first, then by creation timestamp descending.
   * Uses the 'spaceId_idx' index.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<Problem[]>} An array of Problems.
   */
  async findBySpaceId(spaceId: string): Promise<Problem[]> {
    const result = await performOperation<Problem[]>(
      STORE_PROBLEMS,
      'readonly',
      (store) => {
        const index = store.index('spaceId_idx'); // Assumes 'spaceId_idx' index exists
        return index.getAll(spaceId);
      }
    );
    const problems = result || [];
    // Sort: unresolved problems first, then by creation date descending (newest first)
    return problems.sort((a, b) => {
      if (a.resolved === b.resolved) {
        // If both have the same resolved status, sort by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a.resolved ? 1 : -1; // Unresolved (false) come before resolved (true)
    });
  }

  /**
   * Retrieves all Problems from the store.
   * @returns {Promise<Problem[]>} An array of all Problems.
   */
  async getAll(): Promise<Problem[]> {
    const result = await performOperation<Problem[]>(
      STORE_PROBLEMS,
      'readonly',
      (store) => store.getAll()
    );
    return result || [];
  }

  /**
   * Saves a Problem (creates or updates).
   * Automatically updates the `lastModifiedDate` to the current time on each save.
   * @param {Problem} problem - The Problem to save.
   * @returns {Promise<Problem>} The saved Problem with the updated `lastModifiedDate`.
   */
  async save(problem: Problem): Promise<Problem> {
    // Ensure lastModifiedDate is updated on every save
    const problemToSave = { ...problem, lastModifiedDate: new Date().toISOString() };
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) =>
      store.put(problemToSave)
    );
    return problemToSave; // Return the entity with the updated lastModifiedDate
  }

  /**
   * Deletes a Problem by its ID.
   * @param {string} id - The ID of the Problem to delete.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) =>
      store.delete(id)
    );
  }

  /**
   * Deletes all Problems for a given space ID.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<void>}
   */
  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
      return; // No items to delete
    }
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) => {
      itemsToDelete.forEach((item) => {
        store.delete(item.id);
      });
      // Optional: return a request to ensure transaction completion,
      // though performOperation should handle this for multiple operations within a transaction.
      // return store.count();
    });
  }

  /**
   * Clears all Problems from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) => store.clear());
  }
}
