// src/application/use-cases/action-log/log-action.usecase.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID } from '@/lib/constants';

export interface LogActionInputDTO {
  spaceId: string;
  actionDefinitionId: string;
  completedStepId?: string; // For multi-step actions
  notes?: string;
}

export interface LogActionResult {
  loggedAction: ActionLog;
  updatedUserProgress: UserProgress;
}

export class LogActionUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly userProgressRepository: IUserProgressRepository
  ) {}

  async execute(data: LogActionInputDTO): Promise<LogActionResult> {
    const actionDefinition = await this.actionDefinitionRepository.findById(data.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('ActionDefinition not found');
    }
    if (!actionDefinition.isEnabled) {
      throw new Error('Action is not enabled');
    }

    let pointsToAward = 0;
    let isFullCompletion = false;

    if (actionDefinition.type === 'single') {
      pointsToAward = actionDefinition.pointsForCompletion;
    } else if (actionDefinition.type === 'multi-step' && data.completedStepId) {
      const step = actionDefinition.steps?.find(s => s.id === data.completedStepId);
      pointsToAward = step?.pointsPerStep || 0;

      // Check if this completes the multi-step action
      const existingLogsForThisAction = await this.actionLogRepository.findByActionDefinitionId(data.actionDefinitionId);
      const completedStepIds = new Set(existingLogsForThisAction.map(log => log.completedStepId).filter(Boolean));
      completedStepIds.add(data.completedStepId); // Add current step

      const allStepsDefined = actionDefinition.steps?.map(s => s.id) || [];
      if (allStepsDefined.every(stepId => completedStepIds.has(stepId))) {
        pointsToAward += actionDefinition.pointsForCompletion; // Add points for full completion
        isFullCompletion = true;
      }
    } else if (actionDefinition.type === 'multi-step' && !data.completedStepId) {
        // If logging a multi-step action without a specific stepId, assume it's a generic log or full completion
        // This case might need refinement based on UI. For now, assume it's a full completion if no step specified.
        pointsToAward = actionDefinition.pointsForCompletion;
        isFullCompletion = true;
    }


    const newActionLog: ActionLog = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      actionDefinitionId: data.actionDefinitionId,
      timestamp: new Date().toISOString(),
      pointsAwarded: pointsToAward,
      completedStepId: data.completedStepId,
      isMultiStepFullCompletion: isFullCompletion,
      notes: data.notes,
    };

    const loggedAction = await this.actionLogRepository.save(newActionLog);

    // Update User Progress
    let userProgress = await this.userProgressRepository.findByUserId(DEFAULT_USER_ID);
    if (!userProgress) {
      userProgress = { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
    }
    userProgress.points += pointsToAward;
    // Basic leveling logic (can be extracted to a domain service or another use case)
    const pointsNeededForNextLevel = (userProgress.level * POINTS_TO_LEVEL_UP_BASE) * 1.5; // Example
    if (userProgress.points >= pointsNeededForNextLevel) {
      userProgress.level += 1;
      // Potentially reset points for the new level or carry over, depends on game design
    }
    const updatedUserProgress = await this.userProgressRepository.save(userProgress);

    return { loggedAction, updatedUserProgress };
  }
}
