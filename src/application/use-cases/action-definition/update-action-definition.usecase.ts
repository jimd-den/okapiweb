// src/application/use-cases/action-definition/update-action-definition.usecase.ts
import type { ActionDefinition, ActionStep, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export interface UpdateActionDefinitionInputDTO extends Partial<Omit<ActionDefinition, 'id' | 'creationDate' | 'spaceId' | 'steps' | 'formFields'>> {
  id: string;
  steps?: Array<Partial<Omit<ActionStep, 'order'>> & { id?: string }>;
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
      updatedActionDefinition.formFields = undefined; // Clear formFields if type changed to multi-step
      if (data.steps !== undefined) {
        updatedActionDefinition.steps = data.steps.map((stepInput, index) => ({
          id: stepInput.id || self.crypto.randomUUID(),
          description: stepInput.description || '',
          pointsPerStep: stepInput.pointsPerStep ?? 0,
          order: index,
        }));
      }
    } else if (data.type === 'data-entry') {
      updatedActionDefinition.steps = undefined; // Clear steps if type changed to data-entry
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
    } else { // single type
        updatedActionDefinition.steps = undefined;
        updatedActionDefinition.formFields = undefined;
    }
    // If type didn't change and specific fields weren't provided, existing ones remain due to spread.

    return this.actionDefinitionRepository.save(updatedActionDefinition);
  }
}
