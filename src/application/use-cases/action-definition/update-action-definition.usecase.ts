// src/application/use-cases/action-definition/update-action-definition.usecase.ts
/**
 * @file Implements the use case for updating an existing action definition.
 * This use case handles merging provided updates with an existing ActionDefinition entity,
 * including managing its nested steps and form fields, and then persists the changes.
 */

import type { ActionDefinition, ActionStep, FormFieldDefinition } from '@/domain/entities';
import type { IActionDefinitionRepository } from '@/application/ports/repositories';

/**
 * @interface UpdateActionStepInputDTO
 * @description Data Transfer Object for updating an action step.
 * All properties are optional. If `id` is provided, it attempts to update an existing step.
 * If `id` is not provided, a new step might be created (depending on implementation logic).
 * @extends {Partial<Omit<ActionStep, 'order' | 'formFields'>>}
 */
interface UpdateActionStepInputDTO extends Partial<Omit<ActionStep, 'order' | 'formFields'>> {
  /** @property {string} [id] - Optional ID of the step to update. If missing for a new step, it will be generated. */
  id?: string;
  /** @property {Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>} [formFields] - Optional array of form fields for this step. */
  formFields?: Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>;
}

/**
 * @interface UpdateActionDefinitionInputDTO
 * @description Data Transfer Object for updating an action definition.
 * Requires the `id` of the action definition to update. All other properties are optional
 * and will only be applied if provided.
 * @extends {Partial<Omit<ActionDefinition, 'id' | 'creationDate' | 'spaceId' | 'steps' | 'formFields'>>}
 */
export interface UpdateActionDefinitionInputDTO extends Partial<Omit<ActionDefinition, 'id' | 'creationDate' | 'spaceId' | 'steps' | 'formFields'>> {
  /** @property {string} id - The unique identifier of the action definition to update. */
  id: string;
  /** @property {UpdateActionStepInputDTO[]} [steps] - Optional array of steps. If provided, these will replace or update existing steps. */
  steps?: UpdateActionStepInputDTO[];
  /** @property {Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>} [formFields] - Optional array of form fields. If provided, these will replace or update existing form fields. */
  formFields?: Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>;
  /** @property {string | null} [description] - Optional new description. If `null`, the description will be removed. If `undefined`, it remains unchanged. */
  description?: string | null;
}

/**
 * @class UpdateActionDefinitionUseCase
 * @description Use case responsible for updating an existing action definition.
 * It fetches the current entity, applies the provided changes, and saves it back through the repository.
 * Handles nested structures like steps and form fields, including generating new IDs for new nested items.
 */
export class UpdateActionDefinitionUseCase {
  /**
   * Constructs the UpdateActionDefinitionUseCase.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - The repository for action definition data.
   */
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  /**
   * Executes the use case to update an action definition.
   * @param {UpdateActionDefinitionInputDTO} data - The input data containing updates for the action definition.
   * @returns {Promise<ActionDefinition>} A promise that resolves to the updated ActionDefinition entity.
   * @throws {Error} If the action definition with the given ID is not found.
   * @description This method performs the following steps:
   * 1. Fetches the existing action definition using `actionDefinitionRepository.findById`.
   * 2. If not found, throws an error.
   * 3. Merges the provided `data` with the `existingActionDefinition`. Basic properties are updated if present in `data`.
   *    - `description` has special handling: `null` clears it, `undefined` leaves it unchanged.
   * 4. Handles `steps` and `formFields` based on the `type` of the action:
   *    - If `data.type` (or existing type if `data.type` is not provided) is 'multi-step':
   *        - Top-level `formFields` are cleared.
   *        - If `data.steps` is provided, it processes each step:
   *            - If a step has an `id`, it attempts to find the `existingStep` to preserve some fields if not provided in `stepInput`.
   *            - New steps or steps without an `id` get a new UUID.
   *            - Nested `formFields` within steps are processed similarly (new fields get UUIDs).
   *            - The order of steps and nested form fields is based on their array index.
   *    - If `data.type` is 'data-entry':
   *        - `steps` are cleared.
   *        - If `data.formFields` is provided, it processes them, assigning UUIDs to new fields and using array index for order.
   *    - For other types (e.g., 'single', 'timer'), both `steps` and `formFields` are cleared on the updated entity.
   * 5. Saves the `updatedActionDefinition` using `actionDefinitionRepository.save`.
   * 6. Returns the updated and persisted `ActionDefinition`.
   */
  async execute(data: UpdateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const existingActionDefinition = await this.actionDefinitionRepository.findById(data.id);
    if (!existingActionDefinition) {
      throw new Error('ActionDefinition not found for update.');
    }

    // Start with existing data and overwrite with provided data
    const updatedActionDefinition: ActionDefinition = {
      ...existingActionDefinition,
      name: data.name ?? existingActionDefinition.name,
      // Handle description: null means clear, undefined means no change
      description: data.description === null ? undefined : (data.description ?? existingActionDefinition.description),
      type: data.type ?? existingActionDefinition.type, // Type can change
      pointsForCompletion: data.pointsForCompletion ?? existingActionDefinition.pointsForCompletion,
      order: data.order ?? existingActionDefinition.order,
      isEnabled: data.isEnabled ?? existingActionDefinition.isEnabled,
      // Note: spaceId and creationDate are not updatable through this DTO.
    };

    const finalType = updatedActionDefinition.type; // Use the potentially updated type

    // Handle steps and formFields based on the (potentially updated) type
    if (finalType === 'multi-step') {
      updatedActionDefinition.formFields = undefined; // Multi-step actions don't have top-level form fields
      if (data.steps !== undefined) { // Check if steps array is explicitly passed (even if empty)
        updatedActionDefinition.steps = data.steps.map((stepInput, stepIndex) => {
          const existingStep = existingActionDefinition.steps?.find(s => stepInput.id && s.id === stepInput.id);
          const stepId = stepInput.id || self.crypto.randomUUID(); // Generate new ID if not provided

          let processedFormFields: FormFieldDefinition[] | undefined = undefined;
          if (stepInput.stepType === 'data-entry') {
            if (stepInput.formFields) { // New form fields provided
              processedFormFields = stepInput.formFields.map((fieldInput, fieldIndex) => ({
                id: fieldInput.id || self.crypto.randomUUID(),
                name: fieldInput.name || `field_${fieldIndex}`, // Default name if not provided
                label: fieldInput.label || `Field ${fieldIndex + 1}`, // Default label
                fieldType: fieldInput.fieldType || 'text', // Default type
                isRequired: fieldInput.isRequired === undefined ? (existingStep?.formFields?.find(f=>f.id === fieldInput.id)?.isRequired ?? false) : fieldInput.isRequired,
                placeholder: fieldInput.placeholder, // Can be undefined
                order: fieldIndex,
              }));
            } else if (existingStep && existingStep.stepType === 'data-entry' && existingStep.formFields) {
              // No new form fields provided for this data-entry step, retain existing ones
              processedFormFields = existingStep.formFields;
            } else {
              // Data-entry step but no new or existing fields, so undefined
              processedFormFields = undefined;
            }
          }

          return {
            id: stepId,
            description: stepInput.description || existingStep?.description || '',
            pointsPerStep: stepInput.pointsPerStep ?? existingStep?.pointsPerStep ?? 0,
            stepType: stepInput.stepType || existingStep?.stepType || 'description',
            order: stepIndex, // Re-order based on new array
            formFields: processedFormFields,
          };
        });
      }
      // If data.steps is undefined, existingActionDefinition.steps are kept due to initial spread.
      // If type changed to multi-step and data.steps is undefined, steps will remain as they were (or undefined).
    } else if (finalType === 'data-entry') {
      updatedActionDefinition.steps = undefined; // Data-entry actions don't have steps
      if (data.formFields !== undefined) { // Check if formFields array is explicitly passed
        updatedActionDefinition.formFields = data.formFields.map((fieldInput, index) => ({
          id: fieldInput.id || self.crypto.randomUUID(),
          name: fieldInput.name || `field_${index}`,
          label: fieldInput.label || `Field ${index + 1}`,
          fieldType: fieldInput.fieldType || 'text',
          isRequired: fieldInput.isRequired === undefined ? false : fieldInput.isRequired,
          placeholder: fieldInput.placeholder,
          order: index, // Re-order based on new array
        }));
      }
      // If data.formFields is undefined, existingActionDefinition.formFields are kept (if type was already data-entry).
      // If type changed to data-entry and data.formFields is undefined, formFields will remain as they were (or undefined).
    } else { 
        // For 'single', 'timer', or other types, clear both steps and formFields
        updatedActionDefinition.steps = undefined;
        updatedActionDefinition.formFields = undefined;
    }
    
    return this.actionDefinitionRepository.save(updatedActionDefinition);
  }
}
