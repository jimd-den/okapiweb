// src/application/use-cases/data/export-app-data.usecase.ts
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository'; // New
import { DB_VERSION, DEFAULT_USER_ID } from '@/lib/constants';

export class ExportAppDataUseCase {
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

  async execute(): Promise<AppDataExportDTO> {
    const spaces = await this.spaceRepository.getAll();
    const actionDefinitions = await this.actionDefinitionRepository.getAll();
    const actionLogs = await this.actionLogRepository.getAll();
    const problems = await this.problemRepository.getAll();
    const todos = await this.todoRepository.getAll();
    const userProgress = await this.userProgressRepository.findByUserId(DEFAULT_USER_ID);
    const clockEvents = await this.clockEventRepository.getAll();
    const dataEntries = await this.dataEntryLogRepository.getAll(); // New

    return {
      spaces,
      actionDefinitions,
      actionLogs,
      problems,
      todos,
      userProgress: userProgress || { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] },
      clockEvents,
      dataEntries, // New
      schemaVersion: DB_VERSION.toString(),
    };
  }
}
