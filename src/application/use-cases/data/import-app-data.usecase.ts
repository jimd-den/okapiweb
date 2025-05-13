// src/application/use-cases/data/import-app-data.usecase.ts
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionRepository } from '@/application/ports/repositories/iaction.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class ImportAppDataUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionRepository: IActionRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly userProgressRepository: IUserProgressRepository,
    private readonly clockEventRepository: IClockEventRepository
  ) {}

  async execute(data: AppDataExportDTO): Promise<boolean> {
    try {
      // Clear existing data
      await this.spaceRepository.clearAll();
      await this.actionRepository.clearAll();
      await this.problemRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.userProgressRepository.clearAll(); // Might need specific logic if user IDs change
      await this.clockEventRepository.clearAll();

      // Import new data
      for (const space of data.spaces) {
        await this.spaceRepository.save(space);
      }
      for (const action of data.actions) {
        await this.actionRepository.save(action);
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
