// src/application/ports/repositories/iaction-definition.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link ActionDefinition} entity.
 * This interface is part of the application layer's ports, abstracting data persistence mechanisms.
 */

import type { ActionDefinition } from '@/domain/entities/action-definition.entity';

/**
 * @interface IActionDefinitionRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link ActionDefinition} entities. It serves as an abstraction (port) that allows
 * the application layer (use cases) to remain independent of specific database technologies.
 * Concrete implementations of this interface (adapters) will handle the actual data storage and retrieval.
 */
export interface IActionDefinitionRepository {
  /**
   * Finds an ActionDefinition by its unique identifier.
   * @param {string} id - The unique ID of the action definition to find.
   * @returns {Promise<ActionDefinition | null>} A promise that resolves to the ActionDefinition if found, or null otherwise.
   */
  findById(id: string): Promise<ActionDefinition | null>;

  /**
   * Finds all ActionDefinitions associated with a specific space.
   * @param {string} spaceId - The ID of the space for which to retrieve action definitions.
   * @returns {Promise<ActionDefinition[]>} A promise that resolves to an array of ActionDefinitions.
   */
  findBySpaceId(spaceId: string): Promise<ActionDefinition[]>;

  /**
   * Retrieves all ActionDefinitions from the persistence layer.
   * Primarily used for data export or administrative purposes.
   * @returns {Promise<ActionDefinition[]>} A promise that resolves to an array of all ActionDefinitions.
   */
  getAll(): Promise<ActionDefinition[]>;

  /**
   * Saves an ActionDefinition to the persistence layer.
   * This method handles both creation of new action definitions and updates to existing ones.
   * Implementations should typically check if an entity with the same ID exists to determine
   * whether to perform an insert or an update.
   * @param {ActionDefinition} actionDefinition - The ActionDefinition entity to save.
   * @returns {Promise<ActionDefinition>} A promise that resolves to the saved ActionDefinition.
   */
  save(actionDefinition: ActionDefinition): Promise<ActionDefinition>;

  /**
   * Deletes an ActionDefinition from the persistence layer by its unique identifier.
   * @param {string} id - The unique ID of the action definition to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all ActionDefinitions associated with a specific space.
   * Useful for cleaning up data when a space is deleted.
   * @param {string} spaceId - The ID of the space whose action definitions are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteBySpaceId(spaceId: string): Promise<void>;

  /**
   * Clears all ActionDefinitions from the persistence layer.
   * This is typically used for full data resets or during application setup/teardown for testing.
   * @returns {Promise<void>} A promise that resolves when all action definitions have been cleared.
   */
  clearAll(): Promise<void>;
}
