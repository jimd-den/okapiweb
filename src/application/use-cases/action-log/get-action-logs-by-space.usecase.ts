// src/application/use-cases/action-log/get-action-logs-by-space.usecase.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export interface EnrichedActionLog extends ActionLog {
  actionName?: string;
  actionStepDescription?: string;
}

export class GetActionLogsBySpaceUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  async execute(spaceId: string, limit: number = 50): Promise<EnrichedActionLog[]> {
    const logs = await this.actionLogRepository.findBySpaceId(spaceId);
    
    // Sort logs by timestamp descending (newest first)
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const limitedLogs = sortedLogs.slice(0, limit);

    const enrichedLogs: EnrichedActionLog[] = [];

    for (const log of limitedLogs) {
      const actionDef = await this.actionDefinitionRepository.findById(log.actionDefinitionId);
      let stepDescription: string | undefined;
      if (log.completedStepId && actionDef && actionDef.steps) {
        const step = actionDef.steps.find(s => s.id === log.completedStepId);
        stepDescription = step?.description;
      }
      enrichedLogs.push({
        ...log,
        actionName: actionDef?.name || 'Unknown Action',
        actionStepDescription: stepDescription,
      });
    }

    return enrichedLogs;
  }
}
