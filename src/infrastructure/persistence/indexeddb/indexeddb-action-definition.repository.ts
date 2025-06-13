// src/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the IActionDefinitionRepository interface.
 * This class handles all persistence operations for ActionDefinition entities using IndexedDB.
 */

import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import { STORE_ACTION_DEFINITIONS } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository'; // Centralized DB operation logic

/**
 * @class IndexedDBActionDefinitionRepository
 * @implements {IActionDefinitionRepository}
 * @description Manages the persistence of {@link ActionDefinition} entities in IndexedDB.
 * It utilizes the generic `performOperation` function from `indexeddb-base.repository.ts`
 * to interact with the database.
 */
export class IndexedDBActionDefinitionRepository implements IActionDefinitionRepository {
  /**
   * Finds an ActionDefinition by its unique ID.
   * @param {string} id - The ID of the ActionDefinition to find.
   * @returns {Promise<ActionDefinition | null>} The found ActionDefinition or null if not found.
   */
  async findById(id: string): Promise<ActionDefinition | null> {
    const result = await performOperation<ActionDefinition | undefined>(
      STORE_ACTION_DEFINITIONS,
      'readonly',
      store => store.get(id)
    );
    return result || null;
  }

  /**
   * Finds all ActionDefinitions associated with a given space ID.
   * Uses the 'spaceId_idx' index for efficient querying.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<ActionDefinition[]>} An array of ActionDefinitions found for the space.
   */
  async findBySpaceId(spaceId: string): Promise<ActionDefinition[]> {
    const result = await performOperation<ActionDefinition[]>(
      STORE_ACTION_DEFINITIONS,
      'readonly',
      store => {
        const index = store.index('spaceId_idx');
        return index.getAll(spaceId);
      }
    );
    return result || [];
  }
  
  /**
   * Retrieves all ActionDefinitions from the store.
   * @returns {Promise<ActionDefinition[]>} An array of all ActionDefinitions.
   */
  async getAll(): Promise<ActionDefinition[]> {
    const result = await performOperation<ActionDefinition[]>(
      STORE_ACTION_DEFINITIONS,
      'readonly',
      store => store.getAll()
    );
    return result || [];
  }

  /**
   * Saves an ActionDefinition (creates or updates).
   * The `put` operation in IndexedDB handles both insert and update.
   * @param {ActionDefinition} actionDefinition - The ActionDefinition to save.
   * @returns {Promise<ActionDefinition>} The saved ActionDefinition.
   */
  async save(actionDefinition: ActionDefinition): Promise<ActionDefinition> {
    await performOperation(
      STORE_ACTION_DEFINITIONS,
      'readwrite',
      store => store.put(actionDefinition)
    );
    return actionDefinition;
  }

  /**
   * Deletes an ActionDefinition by its ID.
   * @param {string} id - The ID of the ActionDefinition to delete.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    // console.warn(`IndexedDBActionDefinitionRepository.delete(${id})`); // Kept for debugging if needed
    await performOperation(
      STORE_ACTION_DEFINITIONS,
      'readwrite',
      store => store.delete(id)
    );
  }

  /**
   * Deletes all ActionDefinitions associated with a given space ID.
   * This involves fetching all relevant definitions first, then deleting them one by one
   * within a single transaction for atomicity.
   * @param {string} spaceId - The ID of the space whose ActionDefinitions are to be deleted.
   * @returns {Promise<void>}
   */
  async deleteBySpaceId(spaceId: string): Promise<void> {
    // console.warn(`IndexedDBActionDefinitionRepository.deleteBySpaceId(${spaceId})`); // Kept for debugging if needed
    const definitionsToDelete = await this.findBySpaceId(spaceId);
    if (definitionsToDelete.length === 0) {
      return; // No definitions to delete for this spaceId
    }
    await performOperation(STORE_ACTION_DEFINITIONS, 'readwrite', store => {
      definitionsToDelete.forEach(def => store.delete(def.id));
      // The transaction automatically commits upon completion of all requests.
      // Returning something like store.count() or a specific request can ensure the operation completes
      // if performOperation needs an explicit request to track.
      // However, for multiple deletes, this is generally handled by the transaction's lifecycle.
    });
  }
  
  /**
   * Clears all ActionDefinitions from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(
      STORE_ACTION_DEFINITIONS,
      'readwrite',
      store => store.clear()
    );
  }
}
