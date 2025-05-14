// src/application/use-cases/clock-event/save-clock-event.usecase.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

// ClockEvent entity now requires spaceId, so Omit will ensure it's part of the input
export interface SaveClockEventInputDTO extends Omit<ClockEvent, 'id'> {}

export class SaveClockEventUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(data: SaveClockEventInputDTO): Promise<ClockEvent> {
    if (!data.spaceId) {
      throw new Error("spaceId is required to save a clock event.");
    }
    const newClockEvent: ClockEvent = {
      ...data, // spaceId is already in data due to ClockEvent entity change
      id: self.crypto.randomUUID(),
    };
    return this.clockEventRepository.save(newClockEvent);
  }
}
