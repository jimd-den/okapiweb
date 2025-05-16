// src/application/use-cases/action-definition/create-action-definition.usecase.ts
import type { ActionDefinition, ActionStep, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export interface CreateActionDefinitionInputDTO extends Omit<ActionDefinition, 'id' | 'creationDate' | 'isEnabled' | 'steps' | 'formFields'> {
  steps?: Omit<ActionStep, 'id'>[];
  formFields?: Omit<FormFieldDefinition, 'id'>[];
}

export class CreateActionDefinitionUseCase {
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  async execute(data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const newActionDefinition: ActionDefinition = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      isEnabled: true,
      steps: data.type === 'multi-step' && data.steps ? data.steps.map(step => ({ ...step, id: self.crypto.randomUUID() })) : undefined,
      formFields: data.type === 'data-entry' && data.formFields ? data.formFields.map(field => ({ ...field, id: self.crypto.randomUUID() })) : undefined,
      order: data.order || 0,
    };
    return this.actionDefinitionRepository.save(newActionDefinition);
  }
}
