// src/application/use-cases/action-log/log-action.usecase.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export interface LogActionInputDTO {
  spaceId: string;
  actionDefinitionId: string;
  completedStepId?: string; // For multi-step actions
  stepOutcome?: 'completed' | 'skipped'; // Outcome for the step, mandatory if completedStepId is present
  notes?: string;
  durationMs?: number; // For timer actions
}

export interface LogActionResult {
  loggedAction: ActionLog;
}

export class LogActionUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
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

    if (actionDefinition.type === 'single' || actionDefinition.type === 'timer') {
      pointsToAward = actionDefinition.pointsForCompletion;
      isFullCompletion = true; 
    } else if (actionDefinition.type === 'multi-step' && data.completedStepId && data.stepOutcome) {
      const step = actionDefinition.steps?.find(s => s.id === data.completedStepId);
      if (!step) {
        throw new Error(`Step with id ${data.completedStepId} not found in ActionDefinition ${actionDefinition.id}`);
      }

      if (data.stepOutcome === 'completed') {
        pointsToAward = step.pointsPerStep || 0;

        // Check if this step completion leads to full multi-step action completion
        const allLogsForThisActionDef = await this.actionLogRepository.findByActionDefinitionId(data.actionDefinitionId);
        
        const completedStepIdsInHistory = new Set(
          allLogsForThisActionDef
            .filter(log => log.completedStepId && log.stepOutcome === 'completed')
            .map(log => log.completedStepId!)
        );
        // Add the current step being completed
        completedStepIdsInHistory.add(data.completedStepId); 

        const allDefinedStepIds = new Set(actionDefinition.steps?.map(s => s.id) || []);
        
        // Check if all defined steps are now in the completed history
        if (allDefinedStepIds.size > 0 && 
            allDefinedStepIds.size === completedStepIdsInHistory.size &&
            [...allDefinedStepIds].every(definedStepId => completedStepIdsInHistory.has(definedStepId))) {
          pointsToAward += actionDefinition.pointsForCompletion; // Add completion bonus
          isFullCompletion = true;
        }
      } else { // stepOutcome === 'skipped'
        pointsToAward = 0; // No points for skipped steps
        isFullCompletion = false; // Cannot be full completion if a step is skipped
      }
    } else if (actionDefinition.type === 'multi-step' && !data.completedStepId) {
        // This case might represent logging the multi-step action itself, perhaps as a "start" or "overall notes"
        // For now, if no stepId is provided for multi-step, we'll assume it's a log against the main action
        // and award the full completion points (this behavior might need refinement based on exact UX desired)
        pointsToAward = actionDefinition.pointsForCompletion;
        isFullCompletion = true;
    } else if (actionDefinition.type !== 'data-entry') { // Data entry logs are handled separately
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
      durationMs: data.durationMs, // Save duration if provided
    };

    const loggedAction = await this.actionLogRepository.save(newActionLog);

    return { loggedAction };
  }
}
