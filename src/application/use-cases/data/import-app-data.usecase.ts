// src/application/use-cases/data/import-app-data.usecase.ts
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository'; // New

export class ImportAppDataUseCase {
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

  async execute(data: AppDataExportDTO): Promise<boolean> {
    try {
      // Clear existing data
      await this.spaceRepository.clearAll();
      await this.actionDefinitionRepository.clearAll();
      await this.actionLogRepository.clearAll();
      await this.problemRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.userProgressRepository.clearAll();
      await this.clockEventRepository.clearAll();
      await this.dataEntryLogRepository.clearAll(); // New

      // Import new data
      for (const space of data.spaces) {
        await this.spaceRepository.save(space);
      }
      for (const ad of data.actionDefinitions) {
        await this.actionDefinitionRepository.save(ad);
      }
      for (const al of data.actionLogs) {
        await this.actionLogRepository.save(al);
      }
      for (const problem of data.problems) {
        await this.problemRepository.save(problem);
      }
      for (const todo of data.todos) {
        await this.todoRepository.save(todo);
      }
      await this.userProgressRepository.save(data.userProgress);
      for (const clockEvent of data.clockEvents) {
        await this.clockEventRepository.save(clockEvent);
      }
      if (data.dataEntries) { // Check if dataEntries exist in imported file
        for (const dataEntry of data.dataEntries) {
          await this.dataEntryLogRepository.save(dataEntry);
        }
      }
      return true;
    } catch (error) {
      console.error("Error importing data via use case:", error);
      return false;
    }
  }
}
