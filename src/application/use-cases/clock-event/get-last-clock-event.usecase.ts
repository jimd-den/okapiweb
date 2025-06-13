// src/application/use-cases/clock-event/get-last-clock-event.usecase.ts
/**
 * @file Implements the use case for retrieving the most recent clock event for a specific space.
 * This is crucial for determining the current clock-in/out status of a user within that space.
 */

import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

/**
 * @class GetLastClockEventUseCase
 * @description Use case responsible for fetching the last (most recent) {@link ClockEvent}
 * for a given space. This helps determine if the user is currently clocked in or out
 * for that particular space.
 */
export class GetLastClockEventUseCase {
  /**
   * Constructs the GetLastClockEventUseCase.
   * @param {IClockEventRepository} clockEventRepository - The repository for clock event data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  /**
   * Executes the use case to get the last clock event for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve the last clock event.
   * @returns {Promise<ClockEvent | null>} A promise that resolves to the most recent {@link ClockEvent}
   * for the given space, or `null` if no clock events exist for that space or if `spaceId` is not provided.
   * @description This method performs the following:
   * 1. Checks if `spaceId` is provided. If not, it returns `null` (or could throw an error,
   *    but current implementation returns `null` for flexibility).
   * 2. Calls `clockEventRepository.findLastForSpace` to fetch the most recent clock event
   *    associated with the given `spaceId`. The repository is expected to handle the logic
   *    for determining "last" (e.g., based on timestamp).
   * 3. Returns the retrieved clock event or `null`.
   */
  async execute(spaceId: string): Promise<ClockEvent | null> {
    if (!spaceId) {
        // Depending on strictness, could throw new Error("spaceId is required.")
        // console.warn("GetLastClockEventUseCase called without spaceId.");
        return null;
    }
    return this.clockEventRepository.findLastForSpace(spaceId);
  }
}
