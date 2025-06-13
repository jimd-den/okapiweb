// src/application/use-cases/data-entry/update-data-entry.usecase.ts
/**
 * @file Implements the use case for updating an existing data entry log.
 * This use case validates the updated form data against the original form definition
 * and then persists the changes.
 */

import type { DataEntryLog, FormFieldDefinition, ActionDefinition } from '@/domain/entities';
import type { IDataEntryLogRepository, IActionDefinitionRepository } from '@/application/ports/repositories';

/**
 * @interface UpdateDataEntryInputDTO
 * @description Data Transfer Object for updating a data entry log.
 * It requires the ID of the log to update and the new form data.
 * Contextual identifiers like `spaceId`, `actionDefinitionId`, and `stepId` are not
 * directly updatable through this DTO as they define the entry's context.
 */
export interface UpdateDataEntryInputDTO {
  /** @property {string} id - The unique identifier of the {@link DataEntryLog} to update. */
  id: string;
  /** @property {Record<string, any>} formData - An object containing the updated form data.
   * This will replace the existing `data` property of the {@link DataEntryLog}. */
  formData: Record<string, any>;
}

/**
 * @class UpdateDataEntryUseCase
 * @description Use case responsible for updating an existing data entry log.
 * It fetches the existing entry, validates the new data against the relevant form definition
 * (from the associated {@link ActionDefinition} or {@link ActionStep}), updates the entry,
 * and saves it back.
 */
export class UpdateDataEntryUseCase {
  /**
   * Constructs the UpdateDataEntryUseCase.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry log data.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definition data,
   * used to retrieve form field definitions for validation.
   */
  constructor(
    private readonly dataEntryLogRepository: IDataEntryLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  /**
   * Executes the use case to update a data entry log.
   * @param {UpdateDataEntryInputDTO} data - The input data containing the ID of the log to update and the new form data.
   * @returns {Promise<DataEntryLog>} A promise that resolves to the updated {@link DataEntryLog} entity.
   * @throws {Error} If the {@link DataEntryLog} or its associated {@link ActionDefinition} is not found.
   * @throws {Error} If the associated step (for multi-step data entries) is not found or not a 'data-entry' type.
   * @throws {Error} If form field definitions for validation cannot be determined.
   * @throws {Error} If required fields are missing in the new `formData` or if data types are incorrect (e.g., non-numeric for a number field).
   * @description This method performs the following steps:
   * 1. Fetches the existing {@link DataEntryLog} by `data.id`. Throws error if not found.
   * 2. Fetches the associated {@link ActionDefinition} using `existingEntry.actionDefinitionId`. Throws error if not found.
   * 3. Determines the relevant {@link FormFieldDefinition}s for validation:
   *    - If `actionDefinition.type` is 'data-entry', uses `actionDefinition.formFields`.
   *    - If `actionDefinition.type` is 'multi-step' and `existingEntry.stepId` is present:
   *        - Finds the corresponding step in `actionDefinition.steps`.
   *        - Throws error if step not found or not of `stepType` 'data-entry'.
   *        - Uses the step's `formFields`.
   *    - Throws error if form fields cannot be determined.
   * 4. Validates the new `data.formData` against these `formFieldsToValidate` (checks required fields, number types).
   * 5. Creates an `updatedEntry` object by spreading the `existingEntry`, replacing its `data` with `data.formData`,
   *    and updating the `timestamp` to the current time to reflect the modification.
   * 6. Saves the `updatedEntry` using `dataEntryLogRepository.save`.
   * 7. Returns the updated and persisted {@link DataEntryLog}.
   */
  async execute(data: UpdateDataEntryInputDTO): Promise<DataEntryLog> {
    const existingEntry = await this.dataEntryLogRepository.findById(data.id);
    if (!existingEntry) {
      throw new Error('DataEntryLog not found for update.');
    }

    const actionDefinition = await this.actionDefinitionRepository.findById(existingEntry.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('Associated ActionDefinition not found.');
    }

    let formFieldsToValidate: FormFieldDefinition[] | undefined;
    // Determine the source of form field definitions for validation
    if (actionDefinition.type === 'data-entry') {
      formFieldsToValidate = actionDefinition.formFields;
    } else if (actionDefinition.type === 'multi-step' && existingEntry.stepId) {
      const step = actionDefinition.steps?.find(s => s.id === existingEntry.stepId);
      if (!step || step.stepType !== 'data-entry') {
        throw new Error('Associated step for data entry not found or not of type data-entry.');
      }
      formFieldsToValidate = step.formFields;
    } else {
      // This case should ideally not be reached if data integrity is maintained
      throw new Error('Could not determine form fields for validation based on ActionDefinition type and existing entry context.');
    }

    // Validate the new formData
    if (formFieldsToValidate) {
      for (const field of formFieldsToValidate) {
        if (field.isRequired && (data.formData[field.name] === undefined || String(data.formData[field.name]).trim() === '')) {
          throw new Error(`Field "${field.label}" is required.`);
        }
        if (field.fieldType === 'number' && data.formData[field.name] !== '' && data.formData[field.name] !== undefined && isNaN(Number(data.formData[field.name]))) {
          throw new Error(`Field "${field.label}" must be a valid number.`);
        }
      }
    }

    // Create the updated entry object
    const updatedEntry: DataEntryLog = {
      ...existingEntry, // Preserve original IDs, spaceId, actionDefinitionId, stepId, pointsAwarded
      data: data.formData, // Update the form data
      timestamp: new Date().toISOString(), // Update timestamp to reflect modification time
    };

    return this.dataEntryLogRepository.save(updatedEntry);
  }
}
