// src/application/use-cases/data-entry/get-data-entries-by-space.usecase.ts
/**
 * @file Implements the use case for retrieving all data entry logs associated with a specific space.
 * This use case fetches data entry logs and sorts them by timestamp in descending order.
 */

import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';

/**
 * @class GetDataEntriesBySpaceUseCase
 * @description Use case responsible for fetching all {@link DataEntryLog} entities for a given space.
 * It retrieves data entries using the {@link IDataEntryLogRepository} and ensures they are sorted
 * chronologically with the most recent entries appearing first.
 */
export class GetDataEntriesBySpaceUseCase {
  /**
   * Constructs the GetDataEntriesBySpaceUseCase.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - The repository for data entry log data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly dataEntryLogRepository: IDataEntryLogRepository) {}

  /**
   * Executes the use case to get data entry logs for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve data entry logs.
   * @returns {Promise<DataEntryLog[]>} A promise that resolves to an array of {@link DataEntryLog} entities,
   * sorted by their timestamp in descending order (most recent first).
   * @description This method performs the following:
   * 1. Calls `dataEntryLogRepository.findBySpaceId` to fetch all data entry logs for the given `spaceId`.
   * 2. Sorts the retrieved entries by their `timestamp` in descending order.
   * 3. Returns the sorted array of data entry logs.
   * Future enhancements could include pagination or filtering options.
   */
  async execute(spaceId: string): Promise<DataEntryLog[]> {
    // Fetches all data entries associated with the provided spaceId.
    const entries = await this.dataEntryLogRepository.findBySpaceId(spaceId);
    // Sorts the entries by timestamp in descending order (newest first).
    // This is a common requirement for displaying logs or recent activity.
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
