// src/application/use-cases/data/export-app-data.usecase.ts
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionRepository } from '@/application/ports/repositories/iaction.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import { DB_VERSION, DEFAULT_USER_ID } from '@/lib/constants';

export class ExportAppDataUseCase {
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionRepository: IActionRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly userProgressRepository: IUserProgressRepository,
    private readonly clockEventRepository: IClockEventRepository
  ) {}

  async execute(): Promise<AppDataExportDTO> {
    const spaces = await this.spaceRepository.getAll();
    const actions = await this.actionRepository.getAll();
    const problems = await this.problemRepository.getAll();
    const todos = await this.todoRepository.getAll();
    const userProgress = await this.userProgressRepository.findByUserId(DEFAULT_USER_ID);
    const clockEvents = await this.clockEventRepository.getAll();

    return {
      spaces,
      actions,
      problems,
      todos,
      userProgress: userProgress || { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] }, // Provide default if null
      clockEvents,
      schemaVersion: DB_VERSION.toString(),
    };
  }
}
