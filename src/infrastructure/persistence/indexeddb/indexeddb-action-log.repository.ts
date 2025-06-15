// src/infrastructure/persistence/indexeddb/indexeddb-action-log.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the IActionLogRepository interface.
 * This class handles all persistence operations for ActionLog entities using IndexedDB.
 */

import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import { STORE_ACTION_LOGS } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository'; // Using initDB from base is implicit via performOperation

/**
 * @class IndexedDBActionLogRepository
 * @implements {IActionLogRepository}
 * @description Manages the persistence of {@link ActionLog} entities in IndexedDB.
 * It leverages the generic `performOperation` for database interactions.
 */
export class IndexedDBActionLogRepository implements IActionLogRepository {
  /**
   * Finds an ActionLog by its unique ID.
   * @param {string} id - The ID of the ActionLog to find.
   * @returns {Promise<ActionLog | null>} The found ActionLog or null if not found.
   */
  async findById(id: string): Promise<ActionLog | null> {
    const result = await performOperation<ActionLog | undefined>(
      STORE_ACTION_LOGS,
      'readonly',
      store => store.get(id)
    );
    return result || null;
  }

  /**
   * Finds all ActionLogs associated with a given space ID.
   * Uses the 'spaceId_idx' index.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<ActionLog[]>} An array of ActionLogs for the space.
   */
  async findBySpaceId(spaceId: string): Promise<ActionLog[]> {
    const result = await performOperation<ActionLog[]>(
      STORE_ACTION_LOGS,
      'readonly',
      store => {
        const index = store.index('spaceId_idx');
        return index.getAll(spaceId);
      }
    );
    return result || [];
  }
  
  /**
   * Finds all ActionLogs associated with a given action definition ID.
   * Uses the 'actionDefinitionId_idx' index.
   * @param {string} actionDefinitionId - The ID of the action definition.
   * @returns {Promise<ActionLog[]>} An array of ActionLogs for the action definition.
   */
  async findByActionDefinitionId(actionDefinitionId: string): Promise<ActionLog[]> {
    const result = await performOperation<ActionLog[]>(
      STORE_ACTION_LOGS,
      'readonly',
      store => {
        const index = store.index('actionDefinitionId_idx');
        return index.getAll(actionDefinitionId);
      }
    );
    return result || [];
  }
  
  /**
   * Retrieves all ActionLogs from the store.
   * @returns {Promise<ActionLog[]>} An array of all ActionLogs.
   */
  async getAll(): Promise<ActionLog[]> {
    const result = await performOperation<ActionLog[]>(
      STORE_ACTION_LOGS,
      'readonly',
      store => store.getAll()
    );
    return result || [];
  }

  /**
   * Saves an ActionLog (creates or updates).
   * @param {ActionLog} actionLog - The ActionLog to save.
   * @returns {Promise<ActionLog>} The saved ActionLog.
   */
  async save(actionLog: ActionLog): Promise<ActionLog> {
    await performOperation(
      STORE_ACTION_LOGS,
      'readwrite',
      store => store.put(actionLog)
    );
    return actionLog;
  }

  /**
   * Deletes an ActionLog by its ID.
   * @param {string} id - The ID of the ActionLog to delete.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await performOperation(
      STORE_ACTION_LOGS,
      'readwrite',
      store => store.delete(id)
    );
  }

  /**
   * Deletes all ActionLogs associated with a given space ID.
   * Fetches relevant logs first, then deletes them in a single transaction.
   * @param {string} spaceId - The ID of the space whose ActionLogs are to be deleted.
   * @returns {Promise<void>}
   */
  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
        return; // No items to delete
    }
    await performOperation(STORE_ACTION_LOGS, 'readwrite', store => {
      itemsToDelete.forEach(item => {
        store.delete(item.id);
      });
      // Returning a request (like count) can help ensure the transaction completes
      // if performOperation relies on it. For multiple deletes, the transaction
      // should auto-commit after all delete requests are processed.
      // return store.count(); // Optional: can be used if performOperation needs an explicit request.
    });
  }
  
  /**
   * Clears all ActionLogs from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(
      STORE_ACTION_LOGS,
      'readwrite',
      store => store.clear()
    );
  }
}
