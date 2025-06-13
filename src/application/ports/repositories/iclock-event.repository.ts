// src/application/ports/repositories/iclock-event.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link ClockEvent} entity.
 * This interface is part of the application layer's ports, abstracting data persistence for time tracking.
 */

import type { ClockEvent } from '@/domain/entities/clock-event.entity';

/**
 * @interface IClockEventRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link ClockEvent} entities. It abstracts the underlying data storage mechanism, allowing
 * the application layer to manage clock-in/out events without being tied to a specific database.
 */
export interface IClockEventRepository {
  /**
   * Finds a ClockEvent by its unique identifier.
   * @param {string} id - The unique ID of the clock event to find.
   * @returns {Promise<ClockEvent | null>} A promise that resolves to the ClockEvent if found, or null otherwise.
   */
  findById(id: string): Promise<ClockEvent | null>;

  /**
   * Retrieves all ClockEvents from the persistence layer.
   * Useful for data analysis or administrative purposes.
   * @returns {Promise<ClockEvent[]>} A promise that resolves to an array of all ClockEvents.
   */
  getAll(): Promise<ClockEvent[]>;

  /**
   * Finds the most recent ClockEvent for a specific space.
   * This is typically used to determine if a user is currently clocked in or out for that space.
   * @param {string} spaceId - The ID of the space for which to find the last clock event.
   * @returns {Promise<ClockEvent | null>} A promise that resolves to the latest ClockEvent for the space, or null if none exists.
   */
  findLastForSpace(spaceId: string): Promise<ClockEvent | null>;

  /**
   * Saves a ClockEvent to the persistence layer.
   * This method is used for creating new clock-in or clock-out records.
   * @param {ClockEvent} clockEvent - The ClockEvent entity to save.
   * @returns {Promise<ClockEvent>} A promise that resolves to the saved ClockEvent.
   */
  save(clockEvent: ClockEvent): Promise<ClockEvent>;

  /**
   * Clears all ClockEvents from the persistence layer.
   * Typically used for full data resets or testing.
   * @returns {Promise<void>} A promise that resolves when all clock events have been cleared.
   */
  clearAll(): Promise<void>;

  /**
   * Finds all ClockEvents associated with a specific space.
   * @param {string} spaceId - The ID of the space for which to retrieve clock events.
   * @returns {Promise<ClockEvent[]>} A promise that resolves to an array of ClockEvents for the given space, usually sorted by timestamp.
   */
  findBySpaceId(spaceId: string): Promise<ClockEvent[]>;

  /**
   * Deletes all ClockEvents associated with a specific space.
   * This is important for data integrity when a space is deleted.
   * @param {string} spaceId - The ID of the space whose clock events are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteBySpaceId(spaceId: string): Promise<void>;
}
