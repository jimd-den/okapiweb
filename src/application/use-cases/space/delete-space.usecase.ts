// src/application/use-cases/space/delete-space.usecase.ts
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository'; // New

export class DeleteSpaceUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly clockEventRepository: IClockEventRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository // New
  ) {}

  async execute(spaceId: string): Promise<void> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new Error(`Space with ID ${spaceId} not found.`);
    }

    await this.actionDefinitionRepository.deleteBySpaceId(spaceId);
    await this.actionLogRepository.deleteBySpaceId(spaceId);
    await this.todoRepository.deleteBySpaceId(spaceId);
    await this.problemRepository.deleteBySpaceId(spaceId);
    await this.clockEventRepository.deleteBySpaceId(spaceId);
    await this.dataEntryLogRepository.deleteBySpaceId(spaceId); // New
    
    await this.spaceRepository.delete(spaceId);
  }
}
