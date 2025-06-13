// src/application/use-cases/clock-event/get-clock-events-by-space.usecase.ts
/**
 * @file Implements the use case for retrieving all clock events associated with a specific space.
 * This use case fetches clock events and sorts them by timestamp in ascending order,
 * which is often useful for calculating durations or displaying chronological history.
 */

import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

/**
 * @class GetClockEventsBySpaceUseCase
 * @description Use case responsible for fetching all {@link ClockEvent} entities for a given space.
 * It retrieves events using the {@link IClockEventRepository} and ensures they are sorted
 * chronologically from oldest to newest.
 */
export class GetClockEventsBySpaceUseCase {
  /**
   * Constructs the GetClockEventsBySpaceUseCase.
   * @param {IClockEventRepository} clockEventRepository - The repository for clock event data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  /**
   * Executes the use case to get clock events for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve clock events.
   * @returns {Promise<ClockEvent[]>} A promise that resolves to an array of {@link ClockEvent} entities,
   * sorted by their timestamp in ascending order (oldest first).
   * Returns an empty array if `spaceId` is not provided.
   * @description This method performs the following:
   * 1. Validates if `spaceId` is provided. If not, returns an empty array.
   * 2. Calls `clockEventRepository.findBySpaceId` to fetch events for the space.
   *    (Note: The repository implementation might already sort these, e.g., descending by default for `findLastForSpace`).
   * 3. Explicitly sorts the retrieved events by `timestamp` in ascending order. This is particularly
   *    useful for scenarios like calculating total clocked-in time by pairing clock-in/clock-out events.
   * 4. Returns the sorted array of clock events.
   */
  async execute(spaceId: string): Promise<ClockEvent[]> {
    if (!spaceId) {
      return [];
    }
    const events = await this.clockEventRepository.findBySpaceId(spaceId);
    // Repository might sort by timestamp descending by default (e.g., for findLastForSpace).
    // For calculating durations or displaying full history, ascending order is often more useful.
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
