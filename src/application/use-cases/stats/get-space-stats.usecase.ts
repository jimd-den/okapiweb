// src/application/use-cases/stats/get-space-stats.usecase.ts
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
// import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository'; // If clock events are space-specific

export interface SpaceStatsDTO {
  totalPointsEarned: number;
  actionsLoggedCount: number;
  // totalTimeClockedInMs?: number; // If clock events are relevant
}

export class GetSpaceStatsUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository
    // private readonly clockEventRepository: IClockEventRepository // If needed
  ) {}

  async execute(spaceId: string): Promise<SpaceStatsDTO> {
    const actionLogs = await this.actionLogRepository.findBySpaceId(spaceId);

    const totalPointsEarned = actionLogs.reduce((sum, log) => sum + log.pointsAwarded, 0);
    const actionsLoggedCount = actionLogs.length;

    // TODO: Calculate totalTimeClockedInMs if clock events become space-specific
    // For now, this part is omitted.

    return {
      totalPointsEarned,
      actionsLoggedCount,
    };
  }
}
