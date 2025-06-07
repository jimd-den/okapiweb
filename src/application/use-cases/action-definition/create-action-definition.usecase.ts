
// src/application/use-cases/action-definition/create-action-definition.usecase.ts
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities';
import type { IActionDefinitionRepository } from '@/application/ports/repositories';

interface CreateActionStepInputDTO extends Omit<ActionStep, 'id' | 'order' | 'formFields'> {
  formFields?: Omit<FormFieldDefinition, 'id' | 'order'>[];
}

export interface CreateActionDefinitionInputDTO extends Omit<ActionDefinition, 'id' | 'creationDate' | 'isEnabled' | 'steps' | 'formFields'> {
  steps?: CreateActionStepInputDTO[]; 
  formFields?: Omit<FormFieldDefinition, 'id' | 'order'>[]; 
}

export class CreateActionDefinitionUseCase {
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  async execute(data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const newActionDefinition: ActionDefinition = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      isEnabled: true,
      order: data.order || 0,
      steps: data.type === 'multi-step' && data.steps ? data.steps.map((stepInput, stepIndex) => {
        const newStep: ActionStep = {
          id: self.crypto.randomUUID(),
          description: stepInput.description,
          pointsPerStep: stepInput.pointsPerStep || 0,
          stepType: stepInput.stepType || 'description',
          order: stepIndex,
          formFields: (stepInput.stepType === 'data-entry' && stepInput.formFields)
            ? stepInput.formFields.map((fieldInput, fieldIndex) => ({
                ...fieldInput,
                id: self.crypto.randomUUID(),
                order: fieldIndex,
              }))
            : undefined,
        };
        return newStep;
      }) : undefined,
      formFields: data.type === 'data-entry' && data.formFields ? data.formFields.map((fieldInput, fieldIndex) => ({
        ...fieldInput,
        id: self.crypto.randomUUID(),
        order: fieldIndex,
      })) : undefined,
    };
    return this.actionDefinitionRepository.save(newActionDefinition);
  }
}
