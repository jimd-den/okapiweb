
// src/application/use-cases/clock-event/save-clock-event.usecase.ts
import type { ClockEvent } from '@/domain/entities';
import type { IClockEventRepository } from '@/application/ports/repositories';

export interface SaveClockEventInputDTO extends Omit<ClockEvent, 'id'> {}

export class SaveClockEventUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(data: SaveClockEventInputDTO): Promise<ClockEvent> {
    if (!data.spaceId) {
      throw new Error("spaceId is required to save a clock event.");
    }
    const newClockEvent: ClockEvent = {
      ...data, 
      id: self.crypto.randomUUID(),
    };
    return this.clockEventRepository.save(newClockEvent);
  }
}
