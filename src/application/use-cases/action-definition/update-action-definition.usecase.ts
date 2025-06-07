
// src/application/use-cases/action-definition/update-action-definition.usecase.ts
import type { ActionDefinition, ActionStep, FormFieldDefinition } from '@/domain/entities';
import type { IActionDefinitionRepository } from '@/application/ports/repositories';

interface UpdateActionStepInputDTO extends Partial<Omit<ActionStep, 'order' | 'formFields'>> {
  id?: string; 
  formFields?: Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>;
}

export interface UpdateActionDefinitionInputDTO extends Partial<Omit<ActionDefinition, 'id' | 'creationDate' | 'spaceId' | 'steps' | 'formFields'>> {
  id: string;
  steps?: UpdateActionStepInputDTO[];
  formFields?: Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>;
  description?: string | null;
}

export class UpdateActionDefinitionUseCase {
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  async execute(data: UpdateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const existingActionDefinition = await this.actionDefinitionRepository.findById(data.id);
    if (!existingActionDefinition) {
      throw new Error('ActionDefinition not found for update.');
    }

    const updatedActionDefinition: ActionDefinition = {
      ...existingActionDefinition,
      name: data.name ?? existingActionDefinition.name,
      description: data.description === null ? undefined : (data.description ?? existingActionDefinition.description),
      type: data.type ?? existingActionDefinition.type,
      pointsForCompletion: data.pointsForCompletion ?? existingActionDefinition.pointsForCompletion,
      order: data.order ?? existingActionDefinition.order,
      isEnabled: data.isEnabled ?? existingActionDefinition.isEnabled,
    };

    if (data.type === 'multi-step') {
      updatedActionDefinition.formFields = undefined; 
      if (data.steps !== undefined) {
        updatedActionDefinition.steps = data.steps.map((stepInput, stepIndex) => {
          const existingStep = existingActionDefinition.steps?.find(s => s.id === stepInput.id);
          const stepId = stepInput.id || self.crypto.randomUUID();
          return {
            id: stepId,
            description: stepInput.description || existingStep?.description || '',
            pointsPerStep: stepInput.pointsPerStep ?? existingStep?.pointsPerStep ?? 0,
            stepType: stepInput.stepType || existingStep?.stepType || 'description',
            order: stepIndex,
            formFields: (stepInput.stepType === 'data-entry' && stepInput.formFields)
              ? stepInput.formFields.map((fieldInput, fieldIndex) => ({
                  id: fieldInput.id || self.crypto.randomUUID(),
                  name: fieldInput.name || `field_${fieldIndex}`,
                  label: fieldInput.label || `Field ${fieldIndex + 1}`,
                  fieldType: fieldInput.fieldType || 'text',
                  isRequired: fieldInput.isRequired === undefined ? false : fieldInput.isRequired,
                  placeholder: fieldInput.placeholder,
                  order: fieldIndex,
                }))
              : (stepInput.stepType === 'data-entry' && existingStep?.formFields) 
                ? existingStep.formFields 
                : undefined,
          };
        });
      }
    } else if (data.type === 'data-entry') {
      updatedActionDefinition.steps = undefined; 
      if (data.formFields !== undefined) {
        updatedActionDefinition.formFields = data.formFields.map((fieldInput, index) => ({
          id: fieldInput.id || self.crypto.randomUUID(),
          name: fieldInput.name || `field_${index}`,
          label: fieldInput.label || `Field ${index + 1}`,
          fieldType: fieldInput.fieldType || 'text',
          isRequired: fieldInput.isRequired === undefined ? false : fieldInput.isRequired,
          placeholder: fieldInput.placeholder,
          order: index,
        }));
      }
    } else { 
        updatedActionDefinition.steps = undefined;
        updatedActionDefinition.formFields = undefined;
    }
    
    return this.actionDefinitionRepository.save(updatedActionDefinition);
  }
}
