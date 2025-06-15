// src/application/use-cases/data/clear-all-data.usecase.ts
/**
 * @file Implements the use case for clearing all user-specific data from the application.
 * This is a destructive operation intended for scenarios like a full reset of the application state.
 */

import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';

/**
 * @class ClearAllDataUseCase
 * @description Use case responsible for wiping all data related to user activities, configurations, and progress.
 * It achieves this by calling the `clearAll` method on every relevant repository.
 * This use case should be handled with caution in any UI, typically requiring user confirmation.
 */
export class ClearAllDataUseCase {
  /**
   * Constructs the ClearAllDataUseCase.
   * @param {ISpaceRepository} spaceRepository - Repository for spaces.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definitions.
   * @param {IActionLogRepository} actionLogRepository - Repository for action logs.
   * @param {IProblemRepository} problemRepository - Repository for problems.
   * @param {ITodoRepository} todoRepository - Repository for to-dos.
   * @param {IUserProgressRepository} userProgressRepository - Repository for user progress.
   * @param {IClockEventRepository} clockEventRepository - Repository for clock events.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry logs.
   * All these dependencies are injected to ensure all aspects of application data are cleared.
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
   * Executes the use case to clear all application data.
   * @returns {Promise<void>} A promise that resolves when all data clearing operations are complete.
   * @throws {Error} If any of the underlying repository `clearAll` operations fail.
   * @description This method sequentially calls the `clearAll()` method of each injected repository:
   * - Spaces
   * - Action Definitions
   * - Action Logs
   * - Problems
   * - To-dos
   * - User Progress
   * - Clock Events
   * - Data Entry Logs
   * It includes basic error handling and logging.
   */
  async execute(): Promise<void> {
    try {
      // The order of clearing might matter if there are foreign key constraints in a relational DB,
      // but for IndexedDB or NoSQL, it's generally less critical, though clearing dependent data first is good practice.
      // For instance, logs might be cleared before definitions or spaces.
      // Current order seems reasonable for most non-relational setups.
      await this.actionLogRepository.clearAll();
      await this.dataEntryLogRepository.clearAll();
      await this.clockEventRepository.clearAll();
      await this.todoRepository.clearAll();
      await this.problemRepository.clearAll();
      await this.actionDefinitionRepository.clearAll();
      await this.spaceRepository.clearAll();
      await this.userProgressRepository.clearAll(); // User progress might be considered top-level or independent.

      console.log("All application data cleared via use case.");
    } catch (error) {
      console.error("Error clearing all data via use case:", error);
      // Depending on the desired behavior, this might re-throw the error
      // or handle it in a way that allows for partial success or specific error reporting.
      throw error;
    }
  }
}
