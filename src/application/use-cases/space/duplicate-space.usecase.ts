// src/application/use-cases/space/duplicate-space.usecase.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import { format } from 'date-fns';

export interface DuplicateSpaceInputDTO {
  sourceSpaceId: string;
  targetDate: Date; // Use Date object for clarity, will be formatted
}

export class DuplicateSpaceUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  async execute({ sourceSpaceId, targetDate }: DuplicateSpaceInputDTO): Promise<Space> {
    const sourceSpace = await this.spaceRepository.findById(sourceSpaceId);
    if (!sourceSpace) {
      throw new Error('Source space not found.');
    }

    const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');

    // Check if a space with the same name already exists for the target date
    const allSpaces = await this.spaceRepository.getAll(); // In a real app, optimize this
    const existingSpaceForDate = allSpaces.find(s => s.date === formattedTargetDate && s.name === sourceSpace.name);
    if (existingSpaceForDate) {
      throw new Error(`A space named "${sourceSpace.name}" already exists for ${formattedTargetDate}.`);
    }


    const newSpaceId = self.crypto.randomUUID();
    const newSpace: Space = {
      id: newSpaceId,
      name: sourceSpace.name, // Keep the same name or modify as needed (e.g., append date)
      description: sourceSpace.description,
      date: formattedTargetDate,
      creationDate: new Date().toISOString(), // New record creation date
      tags: [...sourceSpace.tags],
      colorScheme: sourceSpace.colorScheme,
      goal: sourceSpace.goal,
    };

    const duplicatedSpace = await this.spaceRepository.save(newSpace);

    const sourceActionDefinitions = await this.actionDefinitionRepository.findBySpaceId(sourceSpaceId);
    for (const ad of sourceActionDefinitions) {
      const newActionDefinition: ActionDefinition = {
        ...ad,
        id: self.crypto.randomUUID(),
        spaceId: newSpaceId,
        creationDate: new Date().toISOString(),
        // Ensure steps and formFields get new IDs if they have them
        steps: ad.steps?.map(step => ({ ...step, id: self.crypto.randomUUID() })),
        formFields: ad.formFields?.map(field => ({ ...field, id: self.crypto.randomUUID() })),
      };
      await this.actionDefinitionRepository.save(newActionDefinition);
    }

    return duplicatedSpace;
  }
}
