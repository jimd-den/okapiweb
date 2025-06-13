// src/application/ports/repositories/ispace.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link Space} entity.
 * This interface is part of the application layer's ports, abstracting data persistence for spaces.
 */

import type { Space } from '@/domain/entities/space.entity';

/**
 * @interface ISpaceRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link Space} entities. It serves as an abstraction (port) enabling the application
 * layer (use cases) to manage spaces without direct dependency on the specific database technology.
 */
export interface ISpaceRepository {
  /**
   * Finds a Space by its unique identifier.
   * @param {string} id - The unique ID of the space to find.
   * @returns {Promise<Space | null>} A promise that resolves to the Space if found, or null otherwise.
   */
  findById(id: string): Promise<Space | null>;

  /**
   * Retrieves all Spaces from the persistence layer.
   * @returns {Promise<Space[]>} A promise that resolves to an array of all Spaces.
   */
  getAll(): Promise<Space[]>;

  /**
   * Saves a Space to the persistence layer.
   * This method handles both creation of new spaces and updates to existing ones.
   * Implementations should determine whether to insert or update based on the presence of the entity's ID.
   * @param {Space} space - The Space entity to save.
   * @returns {Promise<Space>} A promise that resolves to the saved Space.
   */
  save(space: Space): Promise<Space>;

  /**
   * Deletes a Space from the persistence layer by its unique identifier.
   * @param {string} id - The unique ID of the space to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   * @remarks Deleting a space might also involve deleting associated entities (cascade delete),
   * which should be handled by use cases orchestrating this operation, potentially calling
   * other repository methods.
   */
  delete(id: string): Promise<void>;

  /**
   * Clears all Spaces from the persistence layer.
   * This is typically used for full data resets or during testing.
   * @returns {Promise<void>} A promise that resolves when all spaces have been cleared.
   */
  clearAll(): Promise<void>;
}
