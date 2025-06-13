// src/application/use-cases/data/export-app-data.usecase.ts
/**
 * @file Implements the use case for exporting all application data.
 * This use case gathers data from all relevant repositories and packages it into an {@link AppDataExportDTO}.
 */

import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';
// Importing DB_VERSION from infrastructure constants, as it's closely tied to the DB schema version being exported.
import { DB_VERSION } from '@/infrastructure/persistence/indexeddb/indexeddb.constants';
import { DEFAULT_USER_ID } from '@/lib/constants'; // General app constant for default user ID

/**
 * @class ExportAppDataUseCase
 * @description Use case responsible for collecting all user-specific data from various repositories
 * and assembling it into an {@link AppDataExportDTO} for export.
 * This is typically used for backup or migration features.
 */
export class ExportAppDataUseCase {
  /**
   * Constructs the ExportAppDataUseCase.
   * @param {ISpaceRepository} spaceRepository - Repository for spaces.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definitions.
   * @param {IActionLogRepository} actionLogRepository - Repository for action logs.
   * @param {IProblemRepository} problemRepository - Repository for problems.
   * @param {ITodoRepository} todoRepository - Repository for to-dos.
   * @param {IUserProgressRepository} userProgressRepository - Repository for user progress.
   * @param {IClockEventRepository} clockEventRepository - Repository for clock events.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry logs.
   * Each repository is injected to provide access to its respective dataset.
   */
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly userProgressRepository: IUserProgressRepository,
    private readonly clockEventRepository: IClockEventRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository
  ) {}

  /**
   * Executes the use case to export all application data.
   * @returns {Promise<AppDataExportDTO>} A promise that resolves to an {@link AppDataExportDTO}
   * containing arrays of all major domain entities and the current schema version.
   * @description This method performs the following steps:
   * 1. Fetches all entities from each injected repository using their respective `getAll()` methods
   *    (or `findByUserId` for user progress, assuming a single local user).
   * 2. If user progress is not found for the `DEFAULT_USER_ID`, it provides a default/initial UserProgress object.
   * 3. Assembles all fetched data into an `AppDataExportDTO` object.
   * 4. Includes the current `DB_VERSION` (converted to string) as the `schemaVersion` in the DTO.
   * 5. Returns the populated `AppDataExportDTO`.
   */
  async execute(): Promise<AppDataExportDTO> {
    const spaces = await this.spaceRepository.getAll();
    const actionDefinitions = await this.actionDefinitionRepository.getAll();
    const actionLogs = await this.actionLogRepository.getAll();
    const problems = await this.problemRepository.getAll();
    const todos = await this.todoRepository.getAll();
    const userProgress = await this.userProgressRepository.findByUserId(DEFAULT_USER_ID);
    const clockEvents = await this.clockEventRepository.getAll();
    const dataEntries = await this.dataEntryLogRepository.getAll();

    return {
      spaces,
      actionDefinitions,
      actionLogs,
      problems,
      todos,
      // Provide a default UserProgress object if none is found for the default user.
      userProgress: userProgress || { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] },
      clockEvents,
      dataEntries,
      schemaVersion: DB_VERSION.toString(), // Use the imported DB_VERSION
    };
  }
}
