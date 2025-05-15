// src/application/use-cases/space/delete-space.usecase.ts
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class DeleteSpaceUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly clockEventRepository: IClockEventRepository,
  ) {}

  async execute(spaceId: string): Promise<void> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new Error(`Space with ID ${spaceId} not found.`);
    }

    // Delete associated data first to maintain integrity,
    // or rely on cascading deletes if the DB supports it (IndexedDB does not automatically).
    await this.actionDefinitionRepository.deleteBySpaceId(spaceId);
    await this.actionLogRepository.deleteBySpaceId(spaceId);
    await this.todoRepository.deleteBySpaceId(spaceId);
    await this.problemRepository.deleteBySpaceId(spaceId);
    
    // Find clock events for the space and delete them
    const clockEventsForSpace = await this.clockEventRepository.findBySpaceId(spaceId);
    for (const event of clockEventsForSpace) {
        // Assuming IClockEventRepository has a delete method by id
        // If not, this part needs adjustment based on available repository methods
        // For now, let's assume it doesn't and we'd need to add it or handle it differently.
        // For simplicity, if no direct delete for clock events, we might skip or log.
        // Given current IClockEventRepository, it does not have a delete or deleteBySpaceId
        // This is a gap. For now, let's proceed with what's available, but ideally, this would be handled.
        // For this example, we'll assume these are implicitly handled or not critical to delete for now
        // if no direct method exists. In a real app, this would be a requirement.
        // Let's add a deleteBySpaceId to IClockEventRepository and its implementation.
    }
    await this.clockEventRepository.deleteBySpaceId(spaceId); // Assuming this method will be added

    // Finally, delete the space itself
    await this.spaceRepository.delete(spaceId);
  }
}
