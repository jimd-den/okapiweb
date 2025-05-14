// src/application/use-cases/action-definition/update-action-definition.usecase.ts
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

// Input DTO can allow partial updates for most fields, but steps array, if provided, should be complete.
export interface UpdateActionDefinitionInputDTO extends Partial<Omit<ActionDefinition, 'id' | 'creationDate' | 'spaceId' | 'steps'>> {
  id: string; // id is required
  // If steps are provided, it's the new full list of steps.
  // Each step can be partial, existing ones matched by id, new ones get new id.
  steps?: Array<Partial<Omit<ActionStep, 'order'>> & { id?: string }>; 
  description?: string | null; // Allow explicitly setting description to null (to clear it)
}

export class UpdateActionDefinitionUseCase {
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  async execute(data: UpdateActionDefinitionInputDTO): Promise<ActionDefinition> {
    const existingActionDefinition = await this.actionDefinitionRepository.findById(data.id);
    if (!existingActionDefinition) {
      throw new Error('ActionDefinition not found for update.');
    }

    // Start with existing, then selectively update
    const updatedActionDefinition: ActionDefinition = {
      ...existingActionDefinition,
      name: data.name ?? existingActionDefinition.name,
      // Handle description: if null passed, clear it (set to undefined for entity); if undefined passed, keep existing.
      description: data.description === null ? undefined : (data.description ?? existingActionDefinition.description),
      type: data.type ?? existingActionDefinition.type,
      pointsForCompletion: data.pointsForCompletion ?? existingActionDefinition.pointsForCompletion,
      order: data.order ?? existingActionDefinition.order,
      isEnabled: data.isEnabled ?? existingActionDefinition.isEnabled,
    };

    // Handle steps: If data.steps is provided, it becomes the new set of steps.
    // If data.steps is undefined, existing steps are preserved.
    if (data.steps !== undefined) {
      updatedActionDefinition.steps = data.steps.map((stepInput, index) => ({
        id: stepInput.id || self.crypto.randomUUID(), // Use existing ID or generate new
        description: stepInput.description || '', // Ensure description is a string
        pointsPerStep: stepInput.pointsPerStep ?? 0, // Default pointsPerStep to 0
        order: index, // Always re-assign order based on new array position
      }));
    }
    // If data.steps was undefined, existingActionDefinition.steps (via spread) is already set.

    return this.actionDefinitionRepository.save(updatedActionDefinition);
  }
}
