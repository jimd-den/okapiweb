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

  async findLastForSpace(spaceId: string): Promise<ClockEvent | null> {
    const db = await initDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_CLOCK_EVENTS, 'readonly');
        const store = transaction.objectStore(STORE_CLOCK_EVENTS);
        const spaceIndex = store.index('spaceId_idx');
        
        const request = spaceIndex.getAll(spaceId);

        request.onsuccess = () => {
          const eventsForSpace = request.result as ClockEvent[];
          if (eventsForSpace && eventsForSpace.length > 0) {
            // Sort by timestamp descending to get the latest
            eventsForSpace.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            resolve(eventsForSpace[0]);
          } else {
            resolve(null); // No events for this space
          }
        };
        request.onerror = () => {
          console.error("Error in findLastForSpace request:", request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`Failed to start transaction for findLastForSpace:`, error);
        reject(error);
      }
    });
  }

  async findBySpaceId(spaceId: string): Promise<ClockEvent[]> {
    const result = await performOperation<ClockEvent[]>(STORE_CLOCK_EVENTS, 'readonly', store => {
      const index = store.index('spaceId_idx');
      return index.getAll(spaceId);
    });
    // Sort by timestamp descending (newest first)
    return (result || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async save(clockEvent: ClockEvent): Promise<ClockEvent> {
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => store.put(clockEvent));
    return clockEvent;
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => store.clear());
  }
}
