// src/application/use-cases/stats/get-space-stats.usecase.ts
/**
 * @file Implements the use case for calculating and retrieving statistics for a specific Space.
 * This use case currently focuses on stats derived from {@link ActionLog} entities,
 * such as total points earned and the count of logged actions.
 */

import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
// import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository'; // Retained for future reference if clock events are included.

/**
 * @interface SpaceStatsDTO
 * @description Data Transfer Object for space statistics.
 * It provides a summary of key metrics related to user activity within a space.
 */
export interface SpaceStatsDTO {
  /** @property {number} totalPointsEarned - The sum of all points awarded from action logs within this space. */
  totalPointsEarned: number;
  /** @property {number} actionsLoggedCount - The total number of actions logged in this space. */
  actionsLoggedCount: number;
  /** @property {number} [totalTimeClockedInMs] - Optional. The total time clocked in for this space, in milliseconds.
   * This is commented out as its calculation would depend on space-specific clock events. */
  // totalTimeClockedInMs?: number;
}

/**
 * @class GetSpaceStatsUseCase
 * @description Use case responsible for calculating and returning statistics for a given {@link Space}.
 * It primarily uses the {@link IActionLogRepository} to gather data for stats.
 * Future enhancements could include stats from clock events or other relevant entities.
 */
export class GetSpaceStatsUseCase {
  /**
   * Constructs the GetSpaceStatsUseCase.
   * @param {IActionLogRepository} actionLogRepository - Repository for action log data.
   * @param {IClockEventRepository} [clockEventRepository] - Optional repository for clock event data.
   * This would be needed if time-based stats were to be implemented.
   */
  constructor(
    private readonly actionLogRepository: IActionLogRepository
    // private readonly clockEventRepository: IClockEventRepository // Uncomment if/when clock stats are added
  ) {}

  /**
   * Executes the use case to calculate statistics for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to calculate statistics.
   * @returns {Promise<SpaceStatsDTO>} A promise that resolves to a {@link SpaceStatsDTO}
   * containing the calculated statistics.
   * @description This method performs the following steps:
   * 1. Fetches all {@link ActionLog}s associated with the given `spaceId` using `actionLogRepository.findBySpaceId`.
   * 2. Calculates `totalPointsEarned` by summing the `pointsAwarded` from all fetched action logs.
   * 3. Calculates `actionsLoggedCount` as the total number of fetched action logs.
   * 4. (Future Enhancement) If `clockEventRepository` were integrated, it could calculate `totalTimeClockedInMs`.
   * 5. Returns an object conforming to the {@link SpaceStatsDTO} containing the calculated metrics.
   */
  async execute(spaceId: string): Promise<SpaceStatsDTO> {
    const actionLogs = await this.actionLogRepository.findBySpaceId(spaceId);

    const totalPointsEarned = actionLogs.reduce((sum, log) => sum + log.pointsAwarded, 0);
    const actionsLoggedCount = actionLogs.length;

    // TODO: Implement totalTimeClockedInMs calculation if clock events are made space-specific
    // and the IClockEventRepository is injected and used.
    // This would involve fetching clock events for the space and pairing clock-in/clock-out events.
    // For now, this part is omitted from the returned DTO.

    return {
      totalPointsEarned,
      actionsLoggedCount,
      // totalTimeClockedInMs: calculatedTime, // Add when implemented
    };
  }
}
