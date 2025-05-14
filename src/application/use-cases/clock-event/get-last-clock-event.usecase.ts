// src/application/use-cases/clock-event/get-last-clock-event.usecase.ts
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import { DEFAULT_USER_ID } from '@/lib/constants';

export class GetLastClockEventUseCase {
  constructor(private readonly clockEventRepository: IClockEventRepository) {}

  async execute(userId: string = DEFAULT_USER_ID): Promise<ClockEvent | null> {
    // userId is passed for interface consistency, but current ClockEvent entity doesn't store userId.
    // The repository's findLastByUserId method will fetch the globally last event.
    return this.clockEventRepository.findLastByUserId(userId);
  }
}
