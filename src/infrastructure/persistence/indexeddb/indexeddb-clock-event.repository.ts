// src/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import { STORE_CLOCK_EVENTS } from '@/lib/constants';
import { performOperation, initDB } from './indexeddb-base.repository';

export class IndexedDBClockEventRepository implements IClockEventRepository {
  async findById(id: string): Promise<ClockEvent | null> {
    const result = await performOperation<ClockEvent | undefined>(STORE_CLOCK_EVENTS, 'readonly', store => store.get(id));
    return result || null;
  }

  async getAll(): Promise<ClockEvent[]> {
    const result = await performOperation<ClockEvent[]>(STORE_CLOCK_EVENTS, 'readonly', store => store.getAll());
    return result || [];
  }

  async findLastByUserId(userId: string): Promise<ClockEvent | null> {
    // Assuming ClockEvents are global or userId is not strictly enforced on ClockEvent entity for now
    // This implementation fetches all and finds the latest.
    // For a more scalable solution with user-specific clock events, an index on userId and timestamp would be better.
    const db = await initDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_CLOCK_EVENTS, 'readonly');
        const store = transaction.objectStore(STORE_CLOCK_EVENTS);
        const index = store.index('timestamp_idx'); // Use the timestamp index
        const request = index.openCursor(null, 'prev'); // Open cursor in reverse (newest first)

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            // If we had userId on ClockEvent: if (cursor.value.userId === userId) resolve(cursor.value); else cursor.continue();
            resolve(cursor.value as ClockEvent); // Return the first one found (latest)
          } else {
            resolve(null); // No events found
          }
        };
        request.onerror = () => {
          console.error("Error in findLastByUserId cursor:", request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`Failed to start transaction or operation on ${STORE_CLOCK_EVENTS} for findLastByUserId:`, error);
        reject(error);
      }
    });
  }

  async save(clockEvent: ClockEvent): Promise<ClockEvent> {
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => store.put(clockEvent));
    return clockEvent;
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => store.clear());
  }
}
