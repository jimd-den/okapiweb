// src/application/ports/repositories/iclock-event.repository.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';

export interface IClockEventRepository {
  findById(id: string): Promise<ClockEvent | null>;
  getAll(): Promise<ClockEvent[]>;
  findLastForSpace(spaceId: string): Promise<ClockEvent | null>; // Changed from findLastByUserId
  save(clockEvent: ClockEvent): Promise<ClockEvent>;
  clearAll(): Promise<void>;
  findBySpaceId(spaceId: string): Promise<ClockEvent[]>; 
  deleteBySpaceId(spaceId: string): Promise<void>; // Added for cascade delete
}
