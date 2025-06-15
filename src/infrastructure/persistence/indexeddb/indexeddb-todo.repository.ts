// src/infrastructure/persistence/indexeddb/indexeddb-todo.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the ITodoRepository interface.
 * This class handles persistence operations for Todo entities.
 */

import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import { STORE_TODOS } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository';

/**
 * @class IndexedDBTodoRepository
 * @implements {ITodoRepository}
 * @description Manages the persistence of {@link Todo} entities in IndexedDB.
 * It utilizes the generic `performOperation` for database interactions.
 */
export class IndexedDBTodoRepository implements ITodoRepository {
  /**
   * Finds a Todo by its unique ID.
   * @param {string} id - The ID of the Todo to find.
   * @returns {Promise<Todo | null>} The found Todo or null.
   */
  async findById(id: string): Promise<Todo | null> {
    const result = await performOperation<Todo | undefined>(
      STORE_TODOS,
      'readonly',
      (store) => store.get(id)
    );
    return result || null;
  }

  /**
   * Finds all Todos for a given space ID.
   * Results are sorted with incomplete todos first, then by creation date descending (newest first).
   * Uses the 'spaceId_idx' index.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<Todo[]>} An array of Todos.
   */
  async findBySpaceId(spaceId: string): Promise<Todo[]> {
    const result = await performOperation<Todo[]>(
      STORE_TODOS,
      'readonly',
      (store) => {
        const index = store.index('spaceId_idx'); // Assumes 'spaceId_idx' index exists
        return index.getAll(spaceId);
      }
    );
    const todos = result || [];
    // Default sort: incomplete (false) items first, then by creation date descending (newest first).
    return todos.sort((a, b) => {
      if (a.completed === b.completed) {
        // If both have the same completion status, sort by creation date (newest first)
        return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
      }
      return a.completed ? 1 : -1; // Incomplete (false) come before completed (true)
    });
  }

  /**
   * Retrieves all Todos from the store.
   * @returns {Promise<Todo[]>} An array of all Todos.
   */
  async getAll(): Promise<Todo[]> {
    const result = await performOperation<Todo[]>(
      STORE_TODOS,
      'readonly',
      (store) => store.getAll()
    );
    return result || [];
  }

  /**
   * Saves a Todo (creates or updates).
   * Automatically updates the `lastModifiedDate` to the current time on each save.
   * @param {Todo} todo - The Todo to save.
   * @returns {Promise<Todo>} The saved Todo with the updated `lastModifiedDate`.
   */
  async save(todo: Todo): Promise<Todo> {
    // Ensure lastModifiedDate is updated on every save operation
    const todoToSave = { ...todo, lastModifiedDate: new Date().toISOString() };
    await performOperation(STORE_TODOS, 'readwrite', (store) =>
      store.put(todoToSave)
    );
    return todoToSave; // Return the entity with the updated lastModifiedDate
  }

  /**
   * Deletes a Todo by its ID.
   * @param {string} id - The ID of the Todo to delete.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await performOperation(STORE_TODOS, 'readwrite', (store) =>
      store.delete(id)
    );
  }

  /**
   * Deletes all Todos for a given space ID.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<void>}
   */
  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
      return; // No items to delete
    }
    await performOperation(STORE_TODOS, 'readwrite', (store) => {
      itemsToDelete.forEach((item) => {
        store.delete(item.id);
      });
      // Example of returning a request to ensure transaction completion for performOperation, if needed.
      // For multiple deletes, this is often handled by the transaction's auto-commit.
      // return store.count();
    });
  }

  /**
   * Clears all Todos from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(STORE_TODOS, 'readwrite', (store) => store.clear());
  }
}
