
// src/application/use-cases/action-log/get-action-logs-by-space.usecase.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';

export class GetActionLogsBySpaceUseCase {
  constructor(private readonly actionLogRepository: IActionLogRepository) {}

  async execute(spaceId: string): Promise<ActionLog[]> {
    if (!spaceId) {
      return [];
    }
    const logs = await this.actionLogRepository.findBySpaceId(spaceId);
    // Repository might already sort, but ensure descending by timestamp if needed for specific views.
    // For aggregation, order might not matter as much.
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
