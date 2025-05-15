// src/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import { STORE_CLOCK_EVENTS } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

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
    const result = await performOperation<ClockEvent[]>(
      STORE_CLOCK_EVENTS,
      'readonly',
      store => {
        const index = store.index('spaceId_idx');
        const request = index.getAll(spaceId);
        return request;
      }
    );
    const eventsForSpace = result || [];
    if (eventsForSpace.length > 0) {
      // Sort by timestamp descending to get the latest
      eventsForSpace.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return eventsForSpace[0];
    }
    return null;
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

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
        return;
    }
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => {
        itemsToDelete.forEach(item => {
            store.delete(item.id);
        });
        // Return a request to ensure transaction completion
        // Using count as a placeholder for a request that the transaction can wait for.
        return store.count(); 
    });
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_CLOCK_EVENTS, 'readwrite', store => store.clear());
  }
}
