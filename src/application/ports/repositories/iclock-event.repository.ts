// src/application/ports/repositories/iclock-event.repository.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';

export interface IClockEventRepository {
  findById(id: string): Promise<ClockEvent | null>;
  getAll(): Promise<ClockEvent[]>;
  findLastByUserId(userId: string): Promise<ClockEvent | null>; // Assuming userId is part of ClockEvent or queried with it
  save(clockEvent: ClockEvent): Promise<ClockEvent>;
  clearAll(): Promise<void>;
}
