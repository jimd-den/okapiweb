// src/application/use-cases/action-definition/create-action-definition.usecase.ts
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export interface CreateActionDefinitionInputDTO extends Omit<ActionDefinition, 'id' | 'creationDate' | 'isEnabled' | 'steps'> {
  steps?: Omit<ActionStep, 'id'>[];
}

export class CreateActionDefinitionUseCase {
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  async execute(data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const newActionDefinition: ActionDefinition = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      isEnabled: true, // Default to enabled
      steps: data.steps ? data.steps.map(step => ({ ...step, id: self.crypto.randomUUID() })) : undefined,
      order: data.order || 0,
    };
    return this.actionDefinitionRepository.save(newActionDefinition);
  }
}
