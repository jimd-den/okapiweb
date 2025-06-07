
// src/application/use-cases/space/update-space.usecase.ts
import type { Space } from '@/domain/entities';
import type { ISpaceRepository } from '@/application/ports/repositories';

export interface UpdateSpaceInputDTO extends Partial<Omit<Space, 'id' | 'creationDate' | 'date'>> { // date should not be updatable here
  id: string;
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

    const updatedSpace: Space = {
      ...existingSpace,
      name: data.name !== undefined ? data.name.trim() : existingSpace.name,
      description: data.description === null ? undefined : (data.description !== undefined ? data.description.trim() : existingSpace.description),
      goal: data.goal === null ? undefined : (data.goal !== undefined ? data.goal.trim() : existingSpace.goal),
      tags: data.tags !== undefined ? data.tags.map(tag => tag.trim()).filter(tag => tag) : existingSpace.tags,
      colorScheme: data.colorScheme !== undefined ? data.colorScheme : existingSpace.colorScheme,
    };

    if (!updatedSpace.name) {
        throw new Error('Space name cannot be empty.');
    }

    return this.spaceRepository.save(updatedSpace);
  }
}
