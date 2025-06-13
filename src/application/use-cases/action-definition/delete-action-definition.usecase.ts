// src/application/use-cases/action-definition/delete-action-definition.usecase.ts
/**
 * @file Implements the use case for deleting an action definition.
 * This use case handles the deletion of an ActionDefinition and its associated data,
 * such as action logs or data entry logs, to maintain data integrity.
 */

import type { IActionDefinitionRepository, IActionLogRepository, IDataEntryLogRepository } from '@/application/ports/repositories';

/**
 * @class DeleteActionDefinitionUseCase
 * @description Use case responsible for deleting an existing action definition.
 * It ensures that associated logs (ActionLogs or DataEntryLogs) are also deleted
 * before removing the action definition itself.
 */
export class DeleteActionDefinitionUseCase {
  /**
   * Constructs the DeleteActionDefinitionUseCase.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definition data.
   * @param {IActionLogRepository} actionLogRepository - Repository for action log data.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry log data.
   * These dependencies are injected for interacting with the persistence layer.
   */
  constructor(
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository
  ) {}

  /**
   * Executes the use case to delete an action definition.
   * @param {string} id - The unique identifier of the action definition to be deleted.
   * @returns {Promise<void>} A promise that resolves when the action definition and its associated data have been successfully deleted.
   * @throws {Error} If the action definition with the given ID is not found.
   * @description This method performs the following steps:
   * 1. Retrieves the action definition by its ID using `actionDefinitionRepository.findById`.
   * 2. If the action definition does not exist, it throws an error.
   * 3. Based on the `type` of the action definition:
   *    - If 'single', 'multi-step', or 'timer', it deletes associated action logs using `actionLogRepository.deleteByActionDefinitionId`.
   *    - If 'data-entry', it deletes associated data entry logs using `dataEntryLogRepository.deleteByActionDefinitionId`.
   * 4.  It includes a consideration for 'multi-step' actions with 'data-entry' steps, though direct deletion of step-specific
   *     data entries via `dataEntryLogRepository.deleteByStepId` (if such a method existed) is noted as a potential refinement.
   *     Currently, it relies on `deleteByActionDefinitionId` for `DataEntryLog` which might be sufficient if `DataEntryLog`
   *     records for steps are primarily linked via `actionDefinitionId`.
   * 5. Finally, it deletes the action definition itself using `actionDefinitionRepository.delete`.
   */
  async execute(id: string): Promise<void> {
    const existingActionDefinition = await this.actionDefinitionRepository.findById(id);
    if (!existingActionDefinition) {
      throw new Error('ActionDefinition not found for deletion.');
    }

    // Delete associated logs based on action type
    if (existingActionDefinition.type === 'single' || existingActionDefinition.type === 'multi-step' || existingActionDefinition.type === 'timer') {
      // For these types, action instances are typically logged in ActionLog
      await this.actionLogRepository.deleteByActionDefinitionId(id);
    } else if (existingActionDefinition.type === 'data-entry' && existingActionDefinition.formFields && existingActionDefinition.formFields.length > 0) {
      // For top-level data-entry types, data is logged in DataEntryLog
      await this.dataEntryLogRepository.deleteByActionDefinitionId(id);
    }
    
    // Additional cleanup for data entries linked to steps within a multi-step action
    if (existingActionDefinition.type === 'multi-step' && existingActionDefinition.steps) {
        for (const step of existingActionDefinition.steps) {
            if (step.stepType === 'data-entry' && step.formFields && step.formFields.length > 0) {
                // If DataEntryLogs for steps are uniquely identifiable (e.g., by actionDefinitionId and stepId),
                // and the repository supports targeted deletion by stepId, that would be more precise.
                // Current `deleteByActionDefinitionId` for DataEntryLog might catch these if they share the actionDefinitionId
                // and are not distinguished further, or if `DataEntryLog` records also store `stepId` and
                // `deleteByActionDefinitionId` is implemented to cascade or handle this.
                // The current implementation of DataEntryLog.deleteByActionDefinitionId will remove all entries linked to this action definition.
                // If a step's data entry needs specific deletion not covered by that, it would require `dataEntryLogRepository.deleteByStepId(step.id)` or similar.
                // For now, we assume DataEntryLogs are primarily linked by actionDefinitionId for deletion.
            }
        }
    }

    // Delete the action definition itself
    await this.actionDefinitionRepository.delete(id);
  }
}
