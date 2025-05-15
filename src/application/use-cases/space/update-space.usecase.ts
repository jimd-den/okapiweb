// src/application/use-cases/space/update-space.usecase.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

// Allow partial updates, but 'id' is required to identify the space.
// Other fields are optional; if not provided, they won't be updated.
export interface UpdateSpaceInputDTO extends Partial<Omit<Space, 'id' | 'creationDate'>> {
  id: string;
  // Explicitly allow description and goal to be set to null to clear them.
  description?: string | null;
  goal?: string | null;
}

export class UpdateSpaceUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async execute(data: UpdateSpaceInputDTO): Promise<Space> {
    const existingSpace = await this.spaceRepository.findById(data.id);
    if (!existingSpace) {
      throw new Error('Space not found for update.');
    }

    // Create an updated space object, applying changes from data
    // Only update fields that are actually provided in the DTO
    const updatedSpace: Space = {
      ...existingSpace,
      name: data.name !== undefined ? data.name.trim() : existingSpace.name,
      // If description/goal is explicitly null, set to undefined (or however your entity handles clearing)
      // If undefined in DTO, keep existing. If a string, update.
      description: data.description === null ? undefined : (data.description !== undefined ? data.description.trim() : existingSpace.description),
      goal: data.goal === null ? undefined : (data.goal !== undefined ? data.goal.trim() : existingSpace.goal),
      tags: data.tags !== undefined ? data.tags.map(tag => tag.trim()).filter(tag => tag) : existingSpace.tags,
      colorScheme: data.colorScheme !== undefined ? data.colorScheme : existingSpace.colorScheme,
    };

    // Validate name after potential update
    if (!updatedSpace.name) {
        throw new Error('Space name cannot be empty.');
    }

    return this.spaceRepository.save(updatedSpace);
  }
}
