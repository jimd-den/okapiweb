// src/application/ports/repositories/idata-entry-log.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link DataEntryLog} entity.
 * This interface is part of the application layer's ports, abstracting data persistence for form submissions.
 */

import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';

/**
 * @interface IDataEntryLogRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link DataEntryLog} entities. It abstracts the underlying data storage, allowing the
 * application layer to manage data entries from forms without direct dependency on database specifics.
 */
export interface IDataEntryLogRepository {
  /**
   * Finds a DataEntryLog by its unique identifier.
   * @param {string} id - The unique ID of the data entry log to find.
   * @returns {Promise<DataEntryLog | null>} A promise that resolves to the DataEntryLog if found, or null otherwise.
   */
  findById(id: string): Promise<DataEntryLog | null>;

  /**
   * Finds all DataEntryLogs associated with a specific action definition.
   * This is useful for retrieving all data submitted for a particular form or action.
   * @param {string} actionDefinitionId - The ID of the action definition for which to retrieve data entry logs.
   * @returns {Promise<DataEntryLog[]>} A promise that resolves to an array of DataEntryLogs.
   */
  findByActionDefinitionId(actionDefinitionId: string): Promise<DataEntryLog[]>;

  /**
   * Finds all DataEntryLogs associated with a specific space.
   * @param {string} spaceId - The ID of the space for which to retrieve data entry logs.
   * @returns {Promise<DataEntryLog[]>} A promise that resolves to an array of DataEntryLogs.
   */
  findBySpaceId(spaceId: string): Promise<DataEntryLog[]>;

  /**
   * Retrieves all DataEntryLogs from the persistence layer.
   * Useful for comprehensive data analysis, export, or administrative tasks.
   * @returns {Promise<DataEntryLog[]>} A promise that resolves to an array of all DataEntryLogs.
   */
  getAll(): Promise<DataEntryLog[]>;

  /**
   * Saves a DataEntryLog to the persistence layer.
   * This method handles both creation of new data entries and updates to existing ones.
   * @param {DataEntryLog} dataEntryLog - The DataEntryLog entity to save.
   * @returns {Promise<DataEntryLog>} A promise that resolves to the saved DataEntryLog.
   */
  save(dataEntryLog: DataEntryLog): Promise<DataEntryLog>;

  /**
   * Deletes a DataEntryLog from the persistence layer by its unique identifier.
   * @param {string} id - The unique ID of the data entry log to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all DataEntryLogs associated with a specific space.
   * Essential for maintaining data integrity when a space is removed.
   * @param {string} spaceId - The ID of the space whose data entry logs are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteBySpaceId(spaceId: string): Promise<void>;

  /**
   * Deletes all DataEntryLogs associated with a specific action definition.
   * Useful when an action definition is deleted, to clean up related data.
   * @param {string} actionDefinitionId - The ID of the action definition whose data entry logs are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteByActionDefinitionId(actionDefinitionId: string): Promise<void>;

  /**
   * Clears all DataEntryLogs from the persistence layer.
   * This is typically used for full data resets or during testing.
   * @returns {Promise<void>} A promise that resolves when all data entry logs have been cleared.
   */
  clearAll(): Promise<void>;
}
