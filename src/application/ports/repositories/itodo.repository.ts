// src/application/ports/repositories/itodo.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link Todo} entity.
 * This interface is part of the application layer's ports, abstracting data persistence for to-do items.
 */

import type { Todo } from '@/domain/entities/todo.entity';

/**
 * @interface ITodoRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link Todo} entities. It serves as an abstraction (port) enabling the application
 * layer (use cases) to manage to-do items without direct dependency on specific database technology.
 */
export interface ITodoRepository {
  /**
   * Finds a Todo by its unique identifier.
   * @param {string} id - The unique ID of the to-do item to find.
   * @returns {Promise<Todo | null>} A promise that resolves to the Todo if found, or null otherwise.
   */
  findById(id: string): Promise<Todo | null>;

  /**
   * Finds all Todos associated with a specific space.
   * @param {string} spaceId - The ID of the space for which to retrieve to-do items.
   * @returns {Promise<Todo[]>} A promise that resolves to an array of Todos.
   */
  findBySpaceId(spaceId: string): Promise<Todo[]>;

  /**
   * Retrieves all Todos from the persistence layer.
   * Useful for data export or administrative tasks.
   * @returns {Promise<Todo[]>} A promise that resolves to an array of all Todos.
   */
  getAll(): Promise<Todo[]>;

  /**
   * Saves a Todo to the persistence layer.
   * This method handles both creation of new to-do items and updates to existing ones.
   * @param {Todo} todo - The Todo entity to save.
   * @returns {Promise<Todo>} A promise that resolves to the saved Todo.
   */
  save(todo: Todo): Promise<Todo>;

  /**
   * Deletes a Todo from the persistence layer by its unique identifier.
   * @param {string} id - The unique ID of the to-do item to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all Todos associated with a specific space.
   * Important for data cleanup when a space is removed.
   * @param {string} spaceId - The ID of the space whose to-do items are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteBySpaceId(spaceId: string): Promise<void>;

  /**
   * Clears all Todos from the persistence layer.
   * This is typically used for full data resets or during testing.
   * @returns {Promise<void>} A promise that resolves when all to-do items have been cleared.
   */
  clearAll(): Promise<void>;
}
