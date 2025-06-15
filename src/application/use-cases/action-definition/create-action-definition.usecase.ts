// src/application/use-cases/action-definition/create-action-definition.usecase.ts
/**
 * @file Implements the use case for creating a new action definition.
 * This use case orchestrates the creation of an ActionDefinition entity,
 * including its nested steps and form fields if applicable, and persists it using a repository.
 */

import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities';
import type { IActionDefinitionRepository } from '@/application/ports/repositories';

/**
 * @interface CreateActionStepInputDTO
 * @description Data Transfer Object for creating an action step.
 * It omits system-generated fields like 'id' and 'order' from the {@link ActionStep} entity,
 * and also for nested 'formFields'.
 * @extends {Omit<ActionStep, 'id' | 'order' | 'formFields'>}
 */
interface CreateActionStepInputDTO extends Omit<ActionStep, 'id' | 'order' | 'formFields'> {
  /** @property {Omit<FormFieldDefinition, 'id' | 'order'>[]} [formFields] - Optional array of form fields for this step, if it's a data-entry step. */
  formFields?: Omit<FormFieldDefinition, 'id' | 'order'>[];
}

/**
 * @interface CreateActionDefinitionInputDTO
 * @description Data Transfer Object for creating a new action definition.
 * It omits system-generated fields like 'id', 'creationDate', and 'isEnabled' from the {@link ActionDefinition} entity.
 * It also uses {@link CreateActionStepInputDTO} for nested steps and a similar structure for top-level form fields.
 * @extends {Omit<ActionDefinition, 'id' | 'creationDate' | 'isEnabled' | 'steps' | 'formFields'>}
 */
export interface CreateActionDefinitionInputDTO extends Omit<ActionDefinition, 'id' | 'creationDate' | 'isEnabled' | 'steps' | 'formFields'> {
  /** @property {CreateActionStepInputDTO[]} [steps] - Optional array of steps for a 'multi-step' action. */
  steps?: CreateActionStepInputDTO[];
  /** @property {Omit<FormFieldDefinition, 'id' | 'order'>[]} [formFields] - Optional array of form fields for a 'data-entry' action. */
  formFields?: Omit<FormFieldDefinition, 'id' | 'order'>[];
}

/**
 * @class CreateActionDefinitionUseCase
 * @description Use case responsible for creating a new action definition.
 * It takes user-provided data (via DTO), assigns system-generated values (IDs, dates),
 * structures the entity correctly, and then uses the action definition repository to save it.
 */
export class CreateActionDefinitionUseCase {
  /**
   * Constructs the CreateActionDefinitionUseCase.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - The repository for persisting action definition data.
   * This is a dependency injected into the use case, adhering to the Dependency Inversion Principle.
   */
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  /**
   * Executes the use case to create a new action definition.
   * @param {CreateActionDefinitionInputDTO} data - The input data for creating the action definition.
   * @returns {Promise<ActionDefinition>} A promise that resolves to the newly created and persisted ActionDefinition entity.
   * @description This method performs the following steps:
   * 1. Transforms the input DTO (`data`) into a complete `ActionDefinition` entity.
   * 2. Assigns a unique ID using `self.crypto.randomUUID()`.
   * 3. Sets the `creationDate` to the current date and time.
   * 4. Sets `isEnabled` to `true` by default for new action definitions.
   * 5. Sets `order` to the provided value or defaults to 0.
   * 6. If the action type is 'multi-step' and steps are provided, it maps them:
   *    - Assigns unique IDs and order to each step.
   *    - If a step is 'data-entry' and has form fields, assigns unique IDs and order to each field.
   * 7. If the action type is 'data-entry' and top-level form fields are provided, it maps them:
   *    - Assigns unique IDs and order to each field.
   * 8. Calls the `save` method of the injected `actionDefinitionRepository` to persist the new entity.
   * 9. Returns the persisted `ActionDefinition`.
   */
  async execute(data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const newActionDefinition: ActionDefinition = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      isEnabled: true, // New actions are enabled by default
      order: data.order || 0, // Default order to 0 if not provided
      steps: data.type === 'multi-step' && data.steps ? data.steps.map((stepInput, stepIndex) => {
        const newStep: ActionStep = {
          // Ensure all properties of ActionStep are here or explicitly Omit them in DTO
          id: self.crypto.randomUUID(),
          description: stepInput.description,
          pointsPerStep: stepInput.pointsPerStep || 0,
          stepType: stepInput.stepType || 'description', // Default stepType
          order: stepIndex, // Assign order based on array index
          formFields: (stepInput.stepType === 'data-entry' && stepInput.formFields)
            ? stepInput.formFields.map((fieldInput, fieldIndex) => ({
                ...fieldInput, // Spread properties from fieldInput
                id: self.crypto.randomUUID(),
                order: fieldIndex, // Assign order
              }))
            : undefined,
        };
        return newStep;
      }) : undefined, // Set to undefined if not 'multi-step' or no steps provided
      formFields: data.type === 'data-entry' && data.formFields ? data.formFields.map((fieldInput, fieldIndex) => ({
        ...fieldInput, // Spread properties from fieldInput
        id: self.crypto.randomUUID(),
        order: fieldIndex, // Assign order
      })) : undefined, // Set to undefined if not 'data-entry' or no formFields provided
    };
    return this.actionDefinitionRepository.save(newActionDefinition);
  }
}
