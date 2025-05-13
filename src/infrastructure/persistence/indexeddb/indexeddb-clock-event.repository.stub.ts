// src/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository.stub.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
// import { STORE_CLOCK_EVENTS } from '@/lib/constants';
// import { performOperation } from './indexeddb-base.repository';

export class IndexedDBClockEventRepository implements IClockEventRepository {
  async findById(id: string): Promise<ClockEvent | null> {
    console.warn(`STUB: IndexedDBClockEventRepository.findById(${id})`);
    return null;
  }
  async getAll(): Promise<ClockEvent[]> {
    console.warn(`STUB: IndexedDBClockEventRepository.getAll()`);
    return [];
  }
  async findLastByUserId(userId: string): Promise<ClockEvent | null> {
    console.warn(`STUB: IndexedDBClockEventRepository.findLastByUserId(${userId})`);
    return null;
  }
  async save(clockEvent: ClockEvent): Promise<ClockEvent> {
    console.warn(`STUB: IndexedDBClockEventRepository.save()`, clockEvent);
    return clockEvent;
  }
  async clearAll(): Promise<void> {
    console.warn(`STUB: IndexedDBClockEventRepository.clearAll()`);
  }
}
