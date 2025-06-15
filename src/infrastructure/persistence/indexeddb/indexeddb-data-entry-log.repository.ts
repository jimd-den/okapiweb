// src/infrastructure/persistence/indexeddb/indexeddb-data-entry-log.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the IDataEntryLogRepository interface.
 * This class handles persistence operations for DataEntryLog entities.
 */

import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';
import { STORE_DATA_ENTRIES } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository';

/**
 * @class IndexedDBDataEntryLogRepository
 * @implements {IDataEntryLogRepository}
 * @description Manages the persistence of {@link DataEntryLog} entities in IndexedDB.
 * It uses the generic `performOperation` for database interactions.
 */
export class IndexedDBDataEntryLogRepository implements IDataEntryLogRepository {
  /**
   * Finds a DataEntryLog by its unique ID.
   * @param {string} id - The ID of the DataEntryLog to find.
   * @returns {Promise<DataEntryLog | null>} The found DataEntryLog or null.
   */
  async findById(id: string): Promise<DataEntryLog | null> {
    const result = await performOperation<DataEntryLog | undefined>(
      STORE_DATA_ENTRIES,
      'readonly',
      store => store.get(id)
    );
    return result || null;
  }

  /**
   * Finds all DataEntryLogs for a given action definition ID, sorted by timestamp descending.
   * Uses the 'actionDefinitionId_idx' index.
   * @param {string} actionDefinitionId - The ID of the action definition.
   * @returns {Promise<DataEntryLog[]>} An array of DataEntryLogs.
   */
  async findByActionDefinitionId(actionDefinitionId: string): Promise<DataEntryLog[]> {
    const result = await performOperation<DataEntryLog[]>(
      STORE_DATA_ENTRIES,
      'readonly',
      store => {
        const index = store.index('actionDefinitionId_idx');
        return index.getAll(actionDefinitionId);
      }
    );
    // Sort by timestamp descending (newest first)
    return (result || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Finds all DataEntryLogs for a given space ID, sorted by timestamp descending.
   * Uses the 'spaceId_idx' index.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<DataEntryLog[]>} An array of DataEntryLogs.
   */
  async findBySpaceId(spaceId: string): Promise<DataEntryLog[]> {
    const result = await performOperation<DataEntryLog[]>(
      STORE_DATA_ENTRIES,
      'readonly',
      store => {
        const index = store.index('spaceId_idx');
        return index.getAll(spaceId);
      }
    );
    // Sort by timestamp descending (newest first)
    return (result || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Retrieves all DataEntryLogs from the store.
   * @returns {Promise<DataEntryLog[]>} An array of all DataEntryLogs.
   */
  async getAll(): Promise<DataEntryLog[]> {
    const result = await performOperation<DataEntryLog[]>(
      STORE_DATA_ENTRIES,
      'readonly',
      store => store.getAll()
    );
    return result || [];
  }

  /**
   * Saves a DataEntryLog (creates or updates).
   * Automatically updates the `timestamp` to the current time on each save,
   * ensuring it reflects the last modification time if the record is being updated.
   * @param {DataEntryLog} dataEntryLog - The DataEntryLog to save.
   * @returns {Promise<DataEntryLog>} The saved DataEntryLog with the updated timestamp.
   */
  async save(dataEntryLog: DataEntryLog): Promise<DataEntryLog> {
    // Ensure timestamp is updated on every save operation (create or update)
    const entryToSave = { ...dataEntryLog, timestamp: new Date().toISOString() };
    await performOperation(
      STORE_DATA_ENTRIES,
      'readwrite',
      store => store.put(entryToSave)
    );
    return entryToSave; // Return the entity with the potentially updated timestamp
  }

  /**
   * Deletes a DataEntryLog by its ID.
   * @param {string} id - The ID of the DataEntryLog to delete.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await performOperation(
      STORE_DATA_ENTRIES,
      'readwrite',
      store => store.delete(id)
    );
  }
  
  /**
   * Deletes all DataEntryLogs for a given action definition ID.
   * @param {string} actionDefinitionId - The ID of the action definition.
   * @returns {Promise<void>}
   */
  async deleteByActionDefinitionId(actionDefinitionId: string): Promise<void> {
    const itemsToDelete = await this.findByActionDefinitionId(actionDefinitionId);
    if (itemsToDelete.length === 0) return; // No items to delete
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => {
      itemsToDelete.forEach(item => store.delete(item.id));
      // return store.count(); // Optional: ensure transaction completion
    });
  }

  /**
   * Deletes all DataEntryLogs for a given space ID.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<void>}
   */
  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) return; // No items to delete
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => {
      itemsToDelete.forEach(item => store.delete(item.id));
      // return store.count(); // Optional: ensure transaction completion
    });
  }

  /**
   * Clears all DataEntryLogs from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(
      STORE_DATA_ENTRIES,
      'readwrite',
      store => store.clear()
    );
  }
}
