// src/application/use-cases/clock-event/get-last-clock-event.usecase.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class GetLastClockEventUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(spaceId: string): Promise<ClockEvent | null> {
    if (!spaceId) {
        // console.warn("GetLastClockEventUseCase called without spaceId.");
        return null; // Or throw an error, depending on desired strictness
    }
    return this.clockEventRepository.findLastForSpace(spaceId);
  }
}
