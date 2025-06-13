// src/application/use-cases/space/duplicate-space.usecase.ts
/**
 * @file Implements the use case for duplicating an existing Space and its associated ActionDefinitions to a new target date.
 * This allows users to quickly set up a new Space based on an existing one.
 */

import type { Space, ActionDefinition } from '@/domain/entities'; // Combined type imports
import type { ISpaceRepository, IActionDefinitionRepository } from '@/application/ports/repositories'; // Combined type imports
import { format } from 'date-fns'; // Utility for date formatting

/**
 * @interface DuplicateSpaceInputDTO
 * @description Data Transfer Object for duplicating a space.
 * It specifies the ID of the space to be duplicated and the target date for the new space.
 */
export interface DuplicateSpaceInputDTO {
  /** @property {string} sourceSpaceId - The unique identifier of the space to duplicate. */
  sourceSpaceId: string;
  /** @property {Date} targetDate - The JavaScript Date object representing the target date for the new, duplicated space. */
  targetDate: Date;
}

/**
 * @class DuplicateSpaceUseCase
 * @description Use case responsible for duplicating an existing {@link Space} and its
 * associated {@link ActionDefinition}s to a new date.
 * It handles the creation of a new Space entity, copies relevant properties,
 * and then duplicates all action definitions linked to the source space, associating them
 * with the new space and assigning new IDs.
 */
export class DuplicateSpaceUseCase {
  /**
   * Constructs the DuplicateSpaceUseCase.
   * @param {ISpaceRepository} spaceRepository - Repository for space data.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definition data.
   * These are injected to interact with the persistence layer.
   */
  constructor(
    private readonly spaceRepository: ISpaceRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  /**
   * Executes the use case to duplicate a space.
   * @param {DuplicateSpaceInputDTO} input - The input data containing the source space ID and target date.
   * @returns {Promise<Space>} A promise that resolves to the newly created (duplicated) {@link Space} entity.
   * @throws {Error} If the source space is not found.
   * @throws {Error} If a space with the same name already exists for the target date.
   * @description This method performs the following steps:
   * 1. Fetches the `sourceSpace` using `spaceRepository.findById`. Throws error if not found.
   * 2. Formats the `targetDate` to 'yyyy-MM-dd' string format.
   * 3. **Validation**: Checks if a space with the same name as `sourceSpace.name` already exists for the `formattedTargetDate`.
   *    (Note: Current implementation uses `spaceRepository.getAll()` for this check, which might be inefficient for large datasets and should be optimized in a real application, e.g., with a specific query `findByNameAndDate`).
   *    If such a space exists, an error is thrown to prevent duplicate names on the same day.
   * 4. Creates a `newSpace` entity:
   *    - Assigns a new unique ID.
   *    - Copies `name`, `description`, `tags`, `colorScheme`, and `goal` from `sourceSpace`.
   *    - Sets the `date` to `formattedTargetDate`.
   *    - Sets `creationDate` to the current timestamp.
   * 5. Saves the `newSpace` using `spaceRepository.save`.
   * 6. Fetches all {@link ActionDefinition}s associated with the `sourceSpaceId`.
   * 7. For each `sourceActionDefinition`:
   *    - Creates a `newActionDefinition` by copying properties from the source.
   *    - Assigns a new unique ID to the definition itself.
   *    - Sets its `spaceId` to `newSpace.id`.
   *    - Sets `creationDate` to the current timestamp.
   *    - Critically, assigns new unique IDs to all nested `steps` and `formFields` to ensure they are distinct entities.
   *    - Saves the `newActionDefinition` using `actionDefinitionRepository.save`.
   * 8. Returns the `duplicatedSpace` (the new Space entity).
   * @remarks This use case does not duplicate associated ActionLogs, Todos, Problems, ClockEvents, or DataEntryLogs,
   * as these typically represent historical or instance-specific data tied to the original space and date.
   * Only the structural setup (Space and its ActionDefinitions) is duplicated.
   */
  async execute({ sourceSpaceId, targetDate }: DuplicateSpaceInputDTO): Promise<Space> {
    const sourceSpace = await this.spaceRepository.findById(sourceSpaceId);
    if (!sourceSpace) {
      throw new Error('Source space not found.');
    }

    const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');

    // Prevent duplicate space names on the same target date.
    // In a real-world scenario with a larger dataset, this check should be optimized
    // e.g., by adding a specific repository method like `findByNameAndDate(name, date)`.
    const allSpaces = await this.spaceRepository.getAll();
    const existingSpaceForDate = allSpaces.find(s => s.date === formattedTargetDate && s.name === sourceSpace.name);
    if (existingSpaceForDate) {
      throw new Error(`A space named "${sourceSpace.name}" already exists for ${formattedTargetDate}.`);
    }

    // Create the new space entity
    const newSpaceId = self.crypto.randomUUID();
    const newSpace: Space = {
      id: newSpaceId,
      name: sourceSpace.name, // Or potentially modify (e.g., append date/copy indicator)
      description: sourceSpace.description,
      date: formattedTargetDate,
      creationDate: new Date().toISOString(), // New space has its own creation date
      tags: [...sourceSpace.tags], // Deep copy tags array
      colorScheme: sourceSpace.colorScheme,
      goal: sourceSpace.goal,
    };

    const duplicatedSpace = await this.spaceRepository.save(newSpace);

    // Duplicate associated action definitions
    const sourceActionDefinitions = await this.actionDefinitionRepository.findBySpaceId(sourceSpaceId);
    for (const ad of sourceActionDefinitions) {
      const newActionDefinition: ActionDefinition = {
        ...ad, // Spread existing properties
        id: self.crypto.randomUUID(), // New ID for the duplicated action definition
        spaceId: newSpaceId, // Link to the new space
        creationDate: new Date().toISOString(), // New creation date for this duplicated definition
        // Ensure nested structures like steps and formFields also get new IDs
        // to avoid conflicts if they are ever treated as independent entities or referenced directly.
        steps: ad.steps?.map(step => ({
          ...step,
          id: self.crypto.randomUUID(), // New ID for each step
          // If steps have nested formFields, they also need new IDs:
          formFields: step.formFields?.map(ff => ({...ff, id: self.crypto.randomUUID()}))
        })),
        formFields: ad.formFields?.map(field => ({
          ...field,
          id: self.crypto.randomUUID(), // New ID for each top-level form field
        })),
      };
      await this.actionDefinitionRepository.save(newActionDefinition);
    }

    return duplicatedSpace;
  }
}
