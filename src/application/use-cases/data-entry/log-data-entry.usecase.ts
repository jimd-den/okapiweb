// src/application/use-cases/data-entry/log-data-entry.usecase.ts
/**
 * @file Implements the use case for logging data submitted through a data-entry form.
 * This use case validates the submitted data against the form definition within an
 * {@link ActionDefinition} or a specific {@link ActionStep}, and then persists the data.
 */

import type { DataEntryLog, ActionDefinition, FormFieldDefinition } from '@/domain/entities';
import type { IDataEntryLogRepository, IActionDefinitionRepository } from '@/application/ports/repositories';

/**
 * @interface LogDataEntryInputDTO
 * @description Data Transfer Object for logging a data entry.
 * It contains the necessary identifiers for context (space, action definition, optional step)
 * and the actual form data submitted by the user.
 */
export interface LogDataEntryInputDTO {
  /** @property {string} spaceId - The ID of the space where the data entry occurred. */
  spaceId: string;
  /** @property {string} actionDefinitionId - The ID of the {@link ActionDefinition} this data entry is for.
   * This could be a top-level 'data-entry' action or a 'multi-step' action containing the relevant step. */
  actionDefinitionId: string;
  /** @property {string} [stepId] - Optional. If the data entry is for a specific step within a 'multi-step' action, this is the ID of that {@link ActionStep}. */
  stepId?: string;
  /** @property {Record<string, any>} formData - An object containing the submitted form data, where keys are field names and values are the entered data. */
  formData: Record<string, any>;
}

/**
 * @interface LogDataEntryResult
 * @description Defines the structure of the result returned after successfully logging a data entry.
 */
export interface LogDataEntryResult {
  /** @property {DataEntryLog} loggedDataEntry - The newly created and persisted {@link DataEntryLog} entity. */
  loggedDataEntry: DataEntryLog;
}

/**
 * @class LogDataEntryUseCase
 * @description Use case responsible for validating and persisting data submitted from a form.
 * It ensures that required fields are present, performs basic type validation (for numbers),
 * and then creates a {@link DataEntryLog} record.
 */
export class LogDataEntryUseCase {
  /**
   * Constructs the LogDataEntryUseCase.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry log data.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definition data, used to fetch form field definitions for validation.
   */
  constructor(
    private readonly dataEntryLogRepository: IDataEntryLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  /**
   * Executes the use case to log a data entry.
   * @param {LogDataEntryInputDTO} data - The input data for the data entry to be logged.
   * @returns {Promise<LogDataEntryResult>} A promise that resolves to an object containing the created {@link DataEntryLog}.
   * @throws {Error} If the associated {@link ActionDefinition} is not found or not enabled.
   * @throws {Error} If `stepId` is provided but the step is not found or not a 'data-entry' type step.
   * @throws {Error} If the ActionDefinition type is invalid for data entry or if required fields are missing or have incorrect types.
   * @description This method orchestrates the data entry logging process:
   * 1. Fetches the {@link ActionDefinition}. Throws error if not found or disabled.
   * 2. Determines the set of {@link FormFieldDefinition}s to use for validation:
   *    - If `actionDefinition.type` is 'data-entry', uses its `formFields`. Points are awarded from `actionDefinition.pointsForCompletion`.
   *    - If `actionDefinition.type` is 'multi-step' and `data.stepId` is provided:
   *        - Finds the specified step. Throws error if not found or not a 'data-entry' step.
   *        - Uses the step's `formFields`. Points awarded are set to 0 for step-specific data entries (points for steps are usually handled by `LogActionUseCase`).
   *    - Throws error for other invalid scenarios.
   * 3. Validates `data.formData` against the determined `formFieldsToValidate`:
   *    - Checks for required fields.
   *    - Checks if number fields are indeed numbers.
   * 4. Creates a new {@link DataEntryLog} entity with a unique ID, current timestamp, and the validated data.
   * 5. Saves the new log using `dataEntryLogRepository.save`.
   * 6. Returns the persisted {@link DataEntryLog}.
   */
  async execute(data: LogDataEntryInputDTO): Promise<LogDataEntryResult> {
    const actionDefinition = await this.actionDefinitionRepository.findById(data.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('ActionDefinition not found');
    }
    if (!actionDefinition.isEnabled) {
      throw new Error('Parent ActionDefinition is not enabled');
    }

    let formFieldsToValidate: FormFieldDefinition[] | undefined;
    let pointsToAward = 0;

    if (actionDefinition.type === 'data-entry') {
      formFieldsToValidate = actionDefinition.formFields;
      pointsToAward = actionDefinition.pointsForCompletion; // Points for completing a top-level data entry form
    } else if (actionDefinition.type === 'multi-step' && data.stepId) {
      const step = actionDefinition.steps?.find(s => s.id === data.stepId);
      if (!step) throw new Error(`Step with id ${data.stepId} not found in ActionDefinition ${actionDefinition.id}`);
      if (step.stepType !== 'data-entry') throw new Error(`Step ${data.stepId} is not a data-entry step.`);
      formFieldsToValidate = step.formFields;
      // Points for data entry within a step are typically handled by the step completion log in LogActionUseCase.
      // Here, pointsAwarded for the DataEntryLog itself could be 0 or based on a different rule if needed.
      // For simplicity, let's assume 0 for now, as LogActionUseCase would award step.pointsPerStep.
      pointsToAward = 0;
    } else {
      throw new Error('ActionDefinition is not of type data-entry, or stepId is missing for multi-step data entry.');
    }

    // Validate formData against the determined formFields
    if (formFieldsToValidate) {
      for (const field of formFieldsToValidate) {
        if (field.isRequired && (data.formData[field.name] === undefined || String(data.formData[field.name]).trim() === '')) {
          throw new Error(`Field "${field.label}" is required.`);
        }
        // Basic number validation if field is of type number
        if (field.fieldType === 'number' && data.formData[field.name] !== '' && data.formData[field.name] !== undefined && isNaN(Number(data.formData[field.name]))) {
          throw new Error(`Field "${field.label}" must be a valid number.`);
        }
      }
    }
    
    const newDataEntryLog: DataEntryLog = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      actionDefinitionId: data.actionDefinitionId, // Link to parent ActionDefinition
      stepId: data.stepId, // Optional, if part of a multi-step action
      timestamp: new Date().toISOString(),
      data: data.formData,
      pointsAwarded: pointsToAward, // Points specific to this data entry act, if any.
    };

    const loggedDataEntry = await this.dataEntryLogRepository.save(newDataEntryLog);
    return { loggedDataEntry };
  }
}
