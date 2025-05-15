// src/application/use-cases/clock-event/get-all-clock-events.usecase.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class GetAllClockEventsUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(): Promise<ClockEvent[]> {
    // The repository's getAll method should ideally sort by timestamp if not already.
    // For now, we assume it returns all events, and sorting can happen consumer-side if needed.
    return this.clockEventRepository.getAll();
  }
}
