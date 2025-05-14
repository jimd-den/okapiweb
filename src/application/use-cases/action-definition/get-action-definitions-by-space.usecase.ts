// src/application/use-cases/action-definition/get-action-definitions-by-space.usecase.ts
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export class GetActionDefinitionsBySpaceUseCase {
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  async execute(spaceId: string): Promise<ActionDefinition[]> {
    const definitions = await this.actionDefinitionRepository.findBySpaceId(spaceId);
    return definitions.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}
