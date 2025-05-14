// src/application/use-cases/clock-event/save-clock-event.usecase.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export interface SaveClockEventInputDTO extends Omit<ClockEvent, 'id'> {}

export class SaveClockEventUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(data: SaveClockEventInputDTO): Promise<ClockEvent> {
    const newClockEvent: ClockEvent = {
      ...data,
      id: self.crypto.randomUUID(),
    };
    return this.clockEventRepository.save(newClockEvent);
  }
}
