// src/application/use-cases/action-log/get-action-logs-by-space.usecase.ts
/**
 * @file Implements the use case for retrieving all action logs associated with a specific space.
 * This use case fetches action logs and sorts them by timestamp in descending order.
 */

import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';

/**
 * @class GetActionLogsBySpaceUseCase
 * @description Use case responsible for fetching all action logs related to a given space.
 * It utilizes an action log repository to retrieve the data and ensures the logs
 * are sorted chronologically, with the most recent logs appearing first.
 */
export class GetActionLogsBySpaceUseCase {
  /**
   * Constructs the GetActionLogsBySpaceUseCase.
   * @param {IActionLogRepository} actionLogRepository - The repository for accessing action log data.
   * This dependency is injected to abstract the data access mechanism.
   */
  constructor(private readonly actionLogRepository: IActionLogRepository) {}

  /**
   * Executes the use case to get action logs for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve action logs.
   * @returns {Promise<ActionLog[]>} A promise that resolves to an array of {@link ActionLog} entities,
   * sorted by their timestamp in descending order (most recent first).
   * If no `spaceId` is provided, an empty array is returned.
   * @description This method performs the following steps:
   * 1. Checks if `spaceId` is provided. If not, it returns an empty array.
   * 2. Calls `actionLogRepository.findBySpaceId` to fetch all action logs associated with the given `spaceId`.
   * 3. Sorts the retrieved action logs by their `timestamp` in descending order.
   *    This ensures that the most recent activities are listed first.
   * 4. Returns the sorted array of action logs.
   */
  async execute(spaceId: string): Promise<ActionLog[]> {
    if (!spaceId) {
      // Early return if spaceId is not provided, preventing unnecessary repository calls.
      return [];
    }
    const logs = await this.actionLogRepository.findBySpaceId(spaceId);
    // Sort logs by timestamp in descending order (newest first).
    // While the repository might offer sorting, explicitly sorting here ensures the use case's contract.
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
