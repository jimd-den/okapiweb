// src/application/use-cases/data/clear-all-data.usecase.ts
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository'; // New

export class ClearAllDataUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly userProgressRepository: IUserProgressRepository,
    private readonly clockEventRepository: IClockEventRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository // New
  ) {}

  async execute(): Promise<void> {
    try {
      await this.spaceRepository.clearAll();
      await this.actionDefinitionRepository.clearAll();
      await this.actionLogRepository.clearAll();
      await this.problemRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.userProgressRepository.clearAll();
      await this.clockEventRepository.clearAll();
      await this.dataEntryLogRepository.clearAll(); // New
      console.log("All application data cleared via use case.");
    } catch (error) {
      console.error("Error clearing all data via use case:", error);
      throw error;
    }
  }
}
