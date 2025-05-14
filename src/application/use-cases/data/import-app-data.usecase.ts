// src/application/use-cases/data/import-app-data.usecase.ts
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository'; // Added
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository'; // Changed
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class ImportAppDataUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository, // Added
    private readonly actionLogRepository: IActionLogRepository, // Changed
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly userProgressRepository: IUserProgressRepository,
    private readonly clockEventRepository: IClockEventRepository
  ) {}

  async execute(data: AppDataExportDTO): Promise<boolean> {
    try {
      // Clear existing data
      await this.spaceRepository.clearAll();
      await this.actionDefinitionRepository.clearAll(); // Added
      await this.actionLogRepository.clearAll(); // Changed
      await this.problemRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.userProgressRepository.clearAll();
      await this.clockEventRepository.clearAll();

      // Import new data
      for (const space of data.spaces) {
        await this.spaceRepository.save(space);
      }
      for (const ad of data.actionDefinitions) { // Added
        await this.actionDefinitionRepository.save(ad);
      }
      for (const al of data.actionLogs) { // Changed
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
      return true;
    } catch (error) {
      console.error("Error importing data via use case:", error);
      return false;
    }
  }
}
