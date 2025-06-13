// src/application/use-cases/space/delete-space.usecase.ts
/**
 * @file Implements the use case for deleting a Space and all its associated data.
 * This is a critical use case that ensures data integrity by performing a cascade delete
 * of all entities linked to the specified Space.
 */

import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { IClockEventRepository } from '@/application/ports/repositories/iclock-event.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';

/**
 * @class DeleteSpaceUseCase
 * @description Use case responsible for deleting a {@link Space} and all its related data.
 * It orchestrates calls to various repositories to ensure that action definitions, action logs,
 * to-dos, problems, clock events, and data entry logs associated with the space are also removed.
 */
export class DeleteSpaceUseCase {
  /**
   * Constructs the DeleteSpaceUseCase.
   * @param {ISpaceRepository} spaceRepository - Repository for spaces.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definitions.
   * @param {IActionLogRepository} actionLogRepository - Repository for action logs.
   * @param {ITodoRepository} todoRepository - Repository for to-dos.
   * @param {IProblemRepository} problemRepository - Repository for problems.
   * @param {IClockEventRepository} clockEventRepository - Repository for clock events.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry logs.
   * Each repository is injected to handle the deletion of its respective entity type.
   */
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly clockEventRepository: IClockEventRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository
  ) {}

  /**
   * Executes the use case to delete a space and its associated data.
   * @param {string} spaceId - The unique identifier of the space to be deleted.
   * @returns {Promise<void>} A promise that resolves when the space and all its related data have been successfully deleted.
   * @throws {Error} If the space with the given ID is not found.
   * @description This method performs the following steps in sequence:
   * 1. Verifies the existence of the space using `spaceRepository.findById`. Throws an error if not found.
   * 2. Deletes all {@link ActionDefinition}s associated with the `spaceId` using `actionDefinitionRepository.deleteBySpaceId`.
   * 3. Deletes all {@link ActionLog}s associated with the `spaceId` using `actionLogRepository.deleteBySpaceId`.
   * 4. Deletes all {@link Todo}s associated with the `spaceId` using `todoRepository.deleteBySpaceId`.
   * 5. Deletes all {@link Problem}s associated with the `spaceId` using `problemRepository.deleteBySpaceId`.
   * 6. Deletes all {@link ClockEvent}s associated with the `spaceId` using `clockEventRepository.deleteBySpaceId`.
   * 7. Deletes all {@link DataEntryLog}s associated with the `spaceId` using `dataEntryLogRepository.deleteBySpaceId`.
   * 8. Finally, deletes the {@link Space} itself using `spaceRepository.delete`.
   * This order ensures that dependent data is removed before the parent Space entity.
   */
  async execute(spaceId: string): Promise<void> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new Error(`Space with ID ${spaceId} not found.`);
    }

    // Delete associated data first to maintain integrity
    await this.actionDefinitionRepository.deleteBySpaceId(spaceId);
    await this.actionLogRepository.deleteBySpaceId(spaceId);
    await this.todoRepository.deleteBySpaceId(spaceId);
    await this.problemRepository.deleteBySpaceId(spaceId);
    await this.clockEventRepository.deleteBySpaceId(spaceId);
    await this.dataEntryLogRepository.deleteBySpaceId(spaceId);
    
    // Finally, delete the space itself
    await this.spaceRepository.delete(spaceId);
  }
}
