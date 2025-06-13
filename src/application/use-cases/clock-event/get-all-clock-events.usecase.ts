// src/application/use-cases/clock-event/get-all-clock-events.usecase.ts
/**
 * @file Implements the use case for retrieving all clock events across all spaces.
 * This use case is typically used for administrative purposes or comprehensive data export.
 */

import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

/**
 * @class GetAllClockEventsUseCase
 * @description Use case responsible for fetching all {@link ClockEvent} entities from the system.
 * It relies on the {@link IClockEventRepository} to abstract the data retrieval logic.
 */
export class GetAllClockEventsUseCase {
  /**
   * Constructs the GetAllClockEventsUseCase.
   * @param {IClockEventRepository} clockEventRepository - The repository for accessing clock event data.
   * This dependency is injected to decouple the use case from specific data storage implementations.
   */
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  /**
   * Executes the use case to retrieve all clock events.
   * @returns {Promise<ClockEvent[]>} A promise that resolves to an array of all {@link ClockEvent} entities.
   * The order of events is typically determined by the repository implementation (e.g., may be sorted by timestamp).
   * @description This method directly calls the `getAll` method of the injected `clockEventRepository`.
   * It's a straightforward retrieval operation without additional business logic within the use case itself.
   */
  async execute(): Promise<ClockEvent[]> {
    // The repository's getAll method should ideally sort by timestamp if not already.
    // For now, we assume it returns all events, and sorting can happen consumer-side if needed,
    // or the repository implementation can be updated to enforce a default sort order (e.g., by timestamp).
    return this.clockEventRepository.getAll();
  }
}
