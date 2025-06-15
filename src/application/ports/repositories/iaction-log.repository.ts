// src/application/ports/repositories/iaction-log.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link ActionLog} entity.
 * This interface is part of the application layer's ports, abstracting data persistence mechanisms.
 */

import type { ActionLog } from '@/domain/entities/action-log.entity';

/**
 * @interface IActionLogRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link ActionLog} entities. It serves as an abstraction (port) enabling the application
 * layer (use cases) to remain independent of specific database technologies used for storing action logs.
 */
export interface IActionLogRepository {
  /**
   * Finds an ActionLog by its unique identifier.
   * @param {string} id - The unique ID of the action log to find.
   * @returns {Promise<ActionLog | null>} A promise that resolves to the ActionLog if found, or null otherwise.
   */
  findById(id: string): Promise<ActionLog | null>;

  /**
   * Finds all ActionLogs associated with a specific space.
   * @param {string} spaceId - The ID of the space for which to retrieve action logs.
   * @returns {Promise<ActionLog[]>} A promise that resolves to an array of ActionLogs.
   */
  findBySpaceId(spaceId: string): Promise<ActionLog[]>;

  /**
   * Finds all ActionLogs associated with a specific action definition.
   * @param {string} actionDefinitionId - The ID of the action definition for which to retrieve action logs.
   * @returns {Promise<ActionLog[]>} A promise that resolves to an array of ActionLogs.
   */
  findByActionDefinitionId(actionDefinitionId: string): Promise<ActionLog[]>;

  /**
   * Retrieves all ActionLogs from the persistence layer.
   * Useful for data analysis, export, or administrative tasks.
   * @returns {Promise<ActionLog[]>} A promise that resolves to an array of all ActionLogs.
   */
  getAll(): Promise<ActionLog[]>;

  /**
   * Saves an ActionLog to the persistence layer.
   * This method typically handles the creation of new log entries. While updates to logs
   * are generally not expected in a logging system, this interface allows for it if necessary.
   * @param {ActionLog} actionLog - The ActionLog entity to save.
   * @returns {Promise<ActionLog>} A promise that resolves to the saved ActionLog.
   */
  save(actionLog: ActionLog): Promise<ActionLog>;

  /**
   * Deletes an ActionLog from the persistence layer by its unique identifier.
   * @param {string} id - The unique ID of the action log to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all ActionLogs associated with a specific space.
   * Important for data cleanup when a space is removed.
   * @param {string} spaceId - The ID of the space whose action logs are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteBySpaceId(spaceId: string): Promise<void>;

  /**
   * Clears all ActionLogs from the persistence layer.
   * This is typically used for full data resets or during testing.
   * @returns {Promise<void>} A promise that resolves when all action logs have been cleared.
   */
  clearAll(): Promise<void>;
}
