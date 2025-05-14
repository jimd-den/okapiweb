// src/application/use-cases/action-log/log-action.usecase.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID, POINTS_TO_LEVEL_UP_BASE } from '@/lib/constants';

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
      isFullCompletion = true; // A single action is always a full completion of itself
    } else if (actionDefinition.type === 'multi-step' && data.completedStepId) {
      const step = actionDefinition.steps?.find(s => s.id === data.completedStepId);
      if (!step) {
        throw new Error(`Step with id ${data.completedStepId} not found in ActionDefinition ${actionDefinition.id}`);
      }
      pointsToAward = step.pointsPerStep || 0;

      // Check if this completes the multi-step action
      const existingLogsForThisAction = await this.actionLogRepository.findByActionDefinitionId(data.actionDefinitionId);
      const completedStepIds = new Set(existingLogsForThisAction.map(log => log.completedStepId).filter(Boolean));
      completedStepIds.add(data.completedStepId); // Add current step

      const allStepIdsDefined = actionDefinition.steps?.map(s => s.id) || [];
      if (allStepIdsDefined.length > 0 && allStepIdsDefined.every(stepId => completedStepIds.has(stepId))) {
        pointsToAward += actionDefinition.pointsForCompletion; // Add bonus points for full completion of multi-step
        isFullCompletion = true;
      }
    } else if (actionDefinition.type === 'multi-step' && !data.completedStepId) {
        // This case should ideally not happen if UI forces step selection for multi-step.
        // If it does, it might mean logging the overall multi-step action without a specific step.
        // For now, award full completion points if no specific step is logged for a multi-step.
        // This might need refinement based on desired behavior.
        console.warn(`Logging multi-step action '${actionDefinition.name}' without a specific step. Awarding full completion points.`);
        pointsToAward = actionDefinition.pointsForCompletion;
        isFullCompletion = true;
    } else {
      // Should not be reached if actionDefinition.type is validated
      throw new Error('Invalid action type or missing step for multi-step action.');
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
