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
  stepOutcome?: 'completed' | 'skipped'; // Outcome for the step, mandatory if completedStepId is present
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

    if (data.completedStepId && !data.stepOutcome) {
      throw new Error('stepOutcome is required when completedStepId is provided.');
    }

    let pointsToAward = 0;
    let isFullCompletion = false;

    if (actionDefinition.type === 'single') {
      pointsToAward = actionDefinition.pointsForCompletion;
      isFullCompletion = true; 
    } else if (actionDefinition.type === 'multi-step' && data.completedStepId && data.stepOutcome) {
      const step = actionDefinition.steps?.find(s => s.id === data.completedStepId);
      if (!step) {
        throw new Error(`Step with id ${data.completedStepId} not found in ActionDefinition ${actionDefinition.id}`);
      }

      if (data.stepOutcome === 'completed') {
        pointsToAward = step.pointsPerStep || 0;

        // Check if this 'completed' step now makes the multi-step action fully complete
        const allLogsForThisActionDef = await this.actionLogRepository.findByActionDefinitionId(data.actionDefinitionId);
        
        const completedStepIdsInHistory = new Set(
          allLogsForThisActionDef
            .filter(log => log.completedStepId && log.stepOutcome === 'completed')
            .map(log => log.completedStepId!)
        );
        // Add current step being logged as completed
        completedStepIdsInHistory.add(data.completedStepId); 

        const allDefinedStepIds = new Set(actionDefinition.steps?.map(s => s.id) || []);
        
        if (allDefinedStepIds.size > 0 && 
            allDefinedStepIds.size === completedStepIdsInHistory.size &&
            [...allDefinedStepIds].every(definedStepId => completedStepIdsInHistory.has(definedStepId))) {
          pointsToAward += actionDefinition.pointsForCompletion; // Add bonus for full completion
          isFullCompletion = true;
        }
      } else { // stepOutcome is 'skipped'
        pointsToAward = 0; // No points for skipped steps
        isFullCompletion = false; // Skipped step means not fully complete
      }
    } else if (actionDefinition.type === 'multi-step' && !data.completedStepId) {
        // Logging overall multi-step action without a specific step (e.g. deprecated flow or manual log)
        // Award full completion points by default for this scenario, as no specific step outcome is given.
        pointsToAward = actionDefinition.pointsForCompletion;
        isFullCompletion = true;
    } else {
      throw new Error('Invalid action type or missing/inconsistent step data for multi-step action.');
    }


    const newActionLog: ActionLog = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      actionDefinitionId: data.actionDefinitionId,
      timestamp: new Date().toISOString(),
      pointsAwarded: pointsToAward,
      completedStepId: data.completedStepId,
      stepOutcome: data.stepOutcome, // Store the outcome
      isMultiStepFullCompletion: isFullCompletion,
      notes: data.notes,
    };

    const loggedAction = await this.actionLogRepository.save(newActionLog);

    // Update User Progress
    let userProgress = await this.userProgressRepository.findByUserId(DEFAULT_USER_ID);
    if (!userProgress) {
      // This should be handled by the repository's findByUserId for DEFAULT_USER_ID
      userProgress = { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
    }
    userProgress.points += pointsToAward;
    const pointsNeededForNextLevel = (userProgress.level * POINTS_TO_LEVEL_UP_BASE) * 1.5; 
    if (userProgress.points >= pointsNeededForNextLevel && pointsToAward > 0) { // Only level up if points were awarded
      userProgress.level += 1;
    }
    const updatedUserProgress = await this.userProgressRepository.save(userProgress);

    return { loggedAction, updatedUserProgress };
  }
}
