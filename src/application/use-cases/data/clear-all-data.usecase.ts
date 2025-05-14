// src/application/use-cases/data/clear-all-data.usecase.ts
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository'; // Added
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository'; // Changed
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';

export class ClearAllDataUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository, // Added
    private readonly actionLogRepository: IActionLogRepository, // Changed
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly userProgressRepository: IUserProgressRepository,
    private readonly clockEventRepository: IClockEventRepository
  ) {}

  async execute(): Promise<void> {
    try {
      await this.spaceRepository.clearAll();
      await this.actionDefinitionRepository.clearAll(); // Added
      await this.actionLogRepository.clearAll(); // Changed
      await this.problemRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.userProgressRepository.clearAll();
      await this.clockEventRepository.clearAll();
      console.log("All application data cleared via use case.");
    } catch (error) {
      console.error("Error clearing all data via use case:", error);
      throw error; // Re-throw to be handled by the caller
    }
  }
}
