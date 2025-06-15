// src/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository.ts
/**
 * @file Provides the IndexedDB-specific implementation of the IClockEventRepository interface.
 * This class handles persistence operations for ClockEvent entities.
 */

import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import { STORE_CLOCK_EVENTS } from './indexeddb.constants';
import { performOperation } from './indexeddb-base.repository';

/**
 * @class IndexedDBClockEventRepository
 * @implements {IClockEventRepository}
 * @description Manages the persistence of {@link ClockEvent} entities in IndexedDB.
 * It uses the generic `performOperation` for database interactions.
 */
export class IndexedDBClockEventRepository implements IClockEventRepository {
  /**
   * Finds a ClockEvent by its unique ID.
   * @param {string} id - The ID of the ClockEvent to find.
   * @returns {Promise<ClockEvent | null>} The found ClockEvent or null.
   */
  async findById(id: string): Promise<ClockEvent | null> {
    const result = await performOperation<ClockEvent | undefined>(
      STORE_CLOCK_EVENTS,
      'readonly',
      store => store.get(id)
    );
    return result || null;
  }

  /**
   * Retrieves all ClockEvents from the store.
   * @returns {Promise<ClockEvent[]>} An array of all ClockEvents.
   */
  async getAll(): Promise<ClockEvent[]> {
    const result = await performOperation<ClockEvent[]>(
      STORE_CLOCK_EVENTS,
      'readonly',
      store => store.getAll()
    );
    return result || [];
  }

  /**
   * Finds the last (most recent) ClockEvent for a given space ID.
   * It retrieves all clock events for the space and then sorts them to find the latest.
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<ClockEvent | null>} The most recent ClockEvent or null if none found.
   */
  async findLastForSpace(spaceId: string): Promise<ClockEvent | null> {
    const eventsForSpace = await performOperation<ClockEvent[]>(
      STORE_CLOCK_EVENTS,
      'readonly',
      store => {
        const index = store.index('spaceId_idx'); // Assumes 'spaceId_idx' index exists
        return index.getAll(spaceId);
      }
    );

    if (eventsForSpace && eventsForSpace.length > 0) {
      // Sort by timestamp descending to get the latest
      eventsForSpace.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return eventsForSpace[0];
    }
    return null;
  }

  /**
   * Finds all ClockEvents for a given space ID, sorted by timestamp descending (newest first).
   * @param {string} spaceId - The ID of the space.
   * @returns {Promise<ClockEvent[]>} An array of ClockEvents for the space.
   */
  async findBySpaceId(spaceId: string): Promise<ClockEvent[]> {
    const result = await performOperation<ClockEvent[]>(
      STORE_CLOCK_EVENTS,
      'readonly',
      store => {
        const index = store.index('spaceId_idx'); // Assumes 'spaceId_idx' index exists
        return index.getAll(spaceId);
      }
    );
    // Sort by timestamp descending (newest first) by default for this query
    return (result || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Saves a ClockEvent (creates or updates).
   * @param {ClockEvent} clockEvent - The ClockEvent to save.
   * @returns {Promise<ClockEvent>} The saved ClockEvent.
   */
  async save(clockEvent: ClockEvent): Promise<ClockEvent> {
    await performOperation(
      STORE_CLOCK_EVENTS,
      'readwrite',
      store => store.put(clockEvent)
    );
    return clockEvent;
  }

  /**
   * Deletes all ClockEvents for a given space ID.
   * @param {string} spaceId - The ID of the space whose ClockEvents are to be deleted.
   * @returns {Promise<void>}
   */
  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
        return; // No items to delete
    }
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => {
      itemsToDelete.forEach(item => {
        store.delete(item.id);
      });
      // As per other deleteBySpaceId, returning a request like count() is optional
      // if performOperation handles transactions for multiple operations correctly.
      // return store.count();
    });
  }

  /**
   * Clears all ClockEvents from the store.
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await performOperation(
      STORE_CLOCK_EVENTS,
      'readwrite',
      store => store.clear()
    );
  }
}
