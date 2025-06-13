// src/application/use-cases/data/import-app-data.usecase.ts
/**
 * @file Implements the use case for importing application data from an {@link AppDataExportDTO}.
 * This use case first clears all existing data and then imports the data from the provided DTO.
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

/**
 * @class ImportAppDataUseCase
 * @description Use case responsible for importing application data from a provided DTO.
 * It performs a destructive import: all existing data across relevant entities is cleared
 * before the new data is saved. This is suitable for restoring from a backup or full data replacement.
 */
export class ImportAppDataUseCase {
  /**
   * Constructs the ImportAppDataUseCase.
   * @param {ISpaceRepository} spaceRepository - Repository for spaces.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definitions.
   * @param {IActionLogRepository} actionLogRepository - Repository for action logs.
   * @param {IProblemRepository} problemRepository - Repository for problems.
   * @param {ITodoRepository} todoRepository - Repository for to-dos.
   * @param {IUserProgressRepository} userProgressRepository - Repository for user progress.
   * @param {IClockEventRepository} clockEventRepository - Repository for clock events.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry logs.
   * Each repository is injected to manage its respective data set during the import process.
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
   * Executes the use case to import application data.
   * @param {AppDataExportDTO} data - The DTO containing the data to be imported.
   * The `schemaVersion` property of this DTO might be used in future versions for migration logic,
   * but is not explicitly used in the current data replacement logic.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the import was successful,
   * or `false` if an error occurred during the process.
   * @description This method performs the following operations:
   * 1. **Clear Existing Data**: Calls `clearAll()` on each injected repository to remove all current data.
   *    The order of clearing might be adjusted for relational databases with foreign keys, but for IndexedDB
   *    it's generally robust. (Order adjusted to clear dependent data first).
   * 2. **Import New Data**: Iterates through each array of entities in the `data` DTO
   *    (spaces, actionDefinitions, actionLogs, etc.) and saves each entity using its
   *    respective repository's `save()` method.
   *    - It includes a check for `data.dataEntries` to ensure compatibility with older export files
   *      that might not have this property.
   * 3. If all operations complete successfully, it returns `true`.
   * 4. If any error occurs during the process, it logs the error and returns `false`.
   *    A more sophisticated error handling strategy might be needed for partial imports or rollbacks
   *    in a production system, but this provides basic success/failure indication.
   */
  async execute(data: AppDataExportDTO): Promise<boolean> {
    try {
      // Clear existing data - consider order for potential dependencies
      // For example, logs and entries might be cleared before their parent entities
      await this.actionLogRepository.clearAll();
      await this.dataEntryLogRepository.clearAll(); // Clear data entries
      await this.clockEventRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.problemRepository.clearAll();
      await this.actionDefinitionRepository.clearAll();
      await this.spaceRepository.clearAll();
      await this.userProgressRepository.clearAll();


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
      // Ensure userProgress is saved, even if it was null and a default was created during export.
      // The DTO should always contain a valid UserProgress object.
      await this.userProgressRepository.save(data.userProgress);

      for (const clockEvent of data.clockEvents) {
        await this.clockEventRepository.save(clockEvent);
      }
      // Handle dataEntries, checking if it exists for backward compatibility with older exports
      if (data.dataEntries) {
        for (const dataEntry of data.dataEntries) {
          await this.dataEntryLogRepository.save(dataEntry);
        }
      }
      console.log("Application data imported successfully via use case.");
      return true;
    } catch (error) {
      console.error("Error importing data via use case:", error);
      // Consider more specific error handling or re-throwing for the caller to manage
      return false;
    }
  }
}
