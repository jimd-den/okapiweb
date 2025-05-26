
// src/application/use-cases/action-log/log-action.usecase.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
// Removed IUserProgressRepository and related constants as global progress is deprecated

export interface LogActionInputDTO {
  spaceId: string;
  actionDefinitionId: string;
  completedStepId?: string; // For multi-step actions
  stepOutcome?: 'completed' | 'skipped'; // Outcome for the step, mandatory if completedStepId is present
  notes?: string;
}

export interface LogActionResult {
  loggedAction: ActionLog;
  // updatedUserProgress: UserProgress; // Removed global user progress update
}

export class LogActionUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
    // private readonly userProgressRepository: IUserProgressRepository // Removed
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

        const allLogsForThisActionDef = await this.actionLogRepository.findByActionDefinitionId(data.actionDefinitionId);
        
        const completedStepIdsInHistory = new Set(
          allLogsForThisActionDef
            .filter(log => log.completedStepId && log.stepOutcome === 'completed')
            .map(log => log.completedStepId!)
        );
        completedStepIdsInHistory.add(data.completedStepId); 

        const allDefinedStepIds = new Set(actionDefinition.steps?.map(s => s.id) || []);
        
        if (allDefinedStepIds.size > 0 && 
            allDefinedStepIds.size === completedStepIdsInHistory.size &&
            [...allDefinedStepIds].every(definedStepId => completedStepIdsInHistory.has(definedStepId))) {
          pointsToAward += actionDefinition.pointsForCompletion; 
          isFullCompletion = true;
        }
      } else { 
        pointsToAward = 0; 
        isFullCompletion = false; 
      }
    } else if (actionDefinition.type === 'multi-step' && !data.completedStepId) {
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
      stepOutcome: data.stepOutcome,
      isMultiStepFullCompletion: isFullCompletion,
      notes: data.notes,
    };

    const loggedAction = await this.actionLogRepository.save(newActionLog);

    // User Progress update logic removed

    return { loggedAction }; // Return only loggedAction
  }
}
