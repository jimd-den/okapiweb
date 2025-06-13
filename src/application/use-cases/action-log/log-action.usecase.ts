// src/application/use-cases/action-log/log-action.usecase.ts
/**
 * @file Implements the use case for logging an instance of a performed action.
 * This use case is central to tracking user activity. It handles the creation of an ActionLog entry,
 * calculates points awarded based on the action type and completion status (especially for multi-step actions),
 * and persists the log.
 */

import type { ActionLog } from '@/domain/entities';
import type { IActionLogRepository, IActionDefinitionRepository } from '@/application/ports/repositories';

/**
 * @interface LogActionInputDTO
 * @description Data Transfer Object for logging an action.
 * It contains all necessary information to create an {@link ActionLog}.
 */
export interface LogActionInputDTO {
  /** @property {string} spaceId - The ID of the space where the action occurred. */
  spaceId: string;
  /** @property {string} actionDefinitionId - The ID of the {@link ActionDefinition} that was performed. */
  actionDefinitionId: string;
  /** @property {string} [completedStepId] - Optional. If part of a 'multi-step' action, the ID of the specific step completed or skipped. */
  completedStepId?: string;
  /** @property {'completed' | 'skipped'} [stepOutcome] - Optional. Outcome of the step, required if `completedStepId` is provided. */
  stepOutcome?: 'completed' | 'skipped';
  /** @property {string} [notes] - Optional user-provided notes for this action log. */
  notes?: string;
  /** @property {number} [durationMs] - Optional. For 'timer' actions, the duration in milliseconds. */
  durationMs?: number;
}

/**
 * @interface LogActionResult
 * @description Defines the structure of the result returned after successfully logging an action.
 */
export interface LogActionResult {
  /** @property {ActionLog} loggedAction - The newly created and persisted {@link ActionLog} entity. */
  loggedAction: ActionLog;
}

/**
 * @class LogActionUseCase
 * @description Use case responsible for logging an action performed by a user.
 * It interacts with {@link ActionDefinitionRepository} to validate the action and retrieve its details
 * (like points, type, steps) and with {@link ActionLogRepository} to persist the new log entry.
 * It also handles the logic for point calculation, especially for multi-step actions,
 * determining if a step completion also results in the full action completion.
 */
export class LogActionUseCase {
  /**
   * Constructs the LogActionUseCase.
   * @param {IActionLogRepository} actionLogRepository - Repository for action log data.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definition data.
   */
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  /**
   * Executes the use case to log a performed action.
   * @param {LogActionInputDTO} data - The input data for the action to be logged.
   * @returns {Promise<LogActionResult>} A promise that resolves to an object containing the created {@link ActionLog}.
   * @throws {Error} If the ActionDefinition is not found, not enabled, or if input data is inconsistent (e.g., stepId provided without stepOutcome).
   * @description This method orchestrates the logging process:
   * 1. Fetches the corresponding {@link ActionDefinition}. Throws an error if not found or not enabled.
   * 2. Validates input: `stepOutcome` is required if `completedStepId` is present.
   * 3. Calculates `pointsToAward` and `isFullCompletion` status:
   *    - For 'single' or 'timer' actions, awards `pointsForCompletion` from the definition and sets `isFullCompletion` to true.
   *    - For 'multi-step' actions:
   *        - If `completedStepId` and `stepOutcome` are provided:
   *            - Finds the specific step. Throws error if step not found.
   *            - If `stepOutcome` is 'completed', awards `step.pointsPerStep`.
   *            - Checks if all steps of the action are now completed (by looking at historical logs for the same ActionDefinition plus the current step).
   *            - If all steps are completed, adds `actionDefinition.pointsForCompletion` to `pointsToAward` and sets `isFullCompletion` to true.
   *        - If `completedStepId` is NOT provided (implying a direct log of the multi-step action itself, possibly as a "complete all at once" scenario):
   *            - Awards `actionDefinition.pointsForCompletion` and sets `isFullCompletion` to true. This branch handles cases where a multi-step action might be logged as fully completed without individual step logging.
   *    - Throws an error for unhandled action types or inconsistent data for 'multi-step' actions (e.g. type is multi-step but no step info and not a 'data-entry' type which is handled by a different use case).
   * 4. Creates a new {@link ActionLog} entity with a unique ID, current timestamp, and the calculated/provided details.
   * 5. Saves the new log using `actionLogRepository.save`.
   * 6. Returns the persisted `ActionLog`.
   */
  async execute(data: LogActionInputDTO): Promise<LogActionResult> {
    const actionDefinition = await this.actionDefinitionRepository.findById(data.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('ActionDefinition not found');
    }
    if (!actionDefinition.isEnabled) {
      throw new Error('Action is not enabled');
    }

    // Validate input for multi-step actions
    if (data.completedStepId && !data.stepOutcome) {
      throw new Error('stepOutcome is required when completedStepId is provided.');
    }

    let pointsToAward = 0;
    let isFullCompletion = false;

    if (actionDefinition.type === 'single' || actionDefinition.type === 'timer') {
      pointsToAward = actionDefinition.pointsForCompletion;
      isFullCompletion = true;
    } else if (actionDefinition.type === 'multi-step' && data.completedStepId && data.stepOutcome) {
      // Logic for completing a specific step of a multi-step action
      const step = actionDefinition.steps?.find(s => s.id === data.completedStepId);
      if (!step) {
        throw new Error(`Step with id ${data.completedStepId} not found in ActionDefinition ${actionDefinition.id}`);
      }

      if (data.stepOutcome === 'completed') {
        pointsToAward = step.pointsPerStep || 0;

        // Check if this step completion also completes the entire multi-step action
        const allLogsForThisActionDef = await this.actionLogRepository.findByActionDefinitionId(data.actionDefinitionId);
        
        const completedStepIdsInHistory = new Set(
          allLogsForThisActionDef
            .filter(log => log.completedStepId && log.stepOutcome === 'completed')
            .map(log => log.completedStepId!) // `completedStepId` is asserted as non-null due to filter
        );
        completedStepIdsInHistory.add(data.completedStepId); // Add current step

        const allDefinedStepIds = new Set(actionDefinition.steps?.map(s => s.id) || []);
        
        // If all defined steps are now in the completed set
        if (allDefinedStepIds.size > 0 && 
            allDefinedStepIds.size === completedStepIdsInHistory.size &&
            [...allDefinedStepIds].every(definedStepId => completedStepIdsInHistory.has(definedStepId))) {
          pointsToAward += actionDefinition.pointsForCompletion; // Add main points for full completion
          isFullCompletion = true;
        }
      } else { // Step was skipped
        pointsToAward = 0; // No points for skipped steps
        isFullCompletion = false; // Cannot be full completion if a step is skipped
      }
    } else if (actionDefinition.type === 'multi-step' && !data.completedStepId) {
        // This case implies logging the multi-step action as a whole, not a specific step.
        // E.g., a "quick log" feature that marks the entire multi-step action done.
        pointsToAward = actionDefinition.pointsForCompletion;
        isFullCompletion = true;
    } else if (actionDefinition.type !== 'data-entry') { // Data-entry actions are logged via LogDataEntryUseCase
      // This condition might be reached if it's a multi-step action but completedStepId was not provided,
      // and it's not explicitly handled above as a "quick log".
      // Or if it's an unknown action type that isn't 'data-entry'.
      throw new Error('Invalid action type or missing/inconsistent step data for multi-step action.');
    }
    // Note: 'data-entry' type actions are typically logged via LogDataEntryUseCase,
    // so their point calculation isn't handled here. If a 'data-entry' ActionDefinition
    // somehow reaches here, pointsAwarded would remain 0 unless specific logic is added.

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
      durationMs: data.durationMs,
    };

    const loggedAction = await this.actionLogRepository.save(newActionLog);

    return { loggedAction };
  }
}
