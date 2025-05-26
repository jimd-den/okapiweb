
// src/application/use-cases/clock-event/get-clock-events-by-space.usecase.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class GetClockEventsBySpaceUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(spaceId: string): Promise<ClockEvent[]> {
    if (!spaceId) {
      return [];
    }
    const events = await this.clockEventRepository.findBySpaceId(spaceId);
    // Repository already sorts by timestamp descending, which is good for finding the last event.
    // For calculating durations, we might want ascending. Let's sort ascending here.
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
