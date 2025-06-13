// src/application/use-cases/space/update-space.usecase.ts
/**
 * @file Implements the use case for updating an existing Space.
 * This use case allows modification of properties like name, description, goal, tags, and color scheme.
 * The `date` and `creationDate` of a space are considered immutable through this use case.
 */

import type { Space } from '@/domain/entities';
import type { ISpaceRepository } from '@/application/ports/repositories';

/**
 * @interface UpdateSpaceInputDTO
 * @description Data Transfer Object for updating a space.
 * Requires the `id` of the space to update. All other properties are optional.
 * The `date` and `creationDate` properties of a {@link Space} are not updatable via this DTO.
 * `description` and `goal` can be set to `null` to explicitly clear them.
 * @extends {Partial<Omit<Space, 'id' | 'creationDate' | 'date'>>}
 */
export interface UpdateSpaceInputDTO extends Partial<Omit<Space, 'id' | 'creationDate' | 'date'>> {
  /** @property {string} id - The unique identifier of the space to update. */
  id: string;
  /** @property {string | null} [description] - Optional new description. `null` clears it, `undefined` leaves it unchanged. */
  description?: string | null;
  /** @property {string | null} [goal] - Optional new goal. `null` clears it, `undefined` leaves it unchanged. */
  goal?: string | null;
  // Other properties like name, tags, colorScheme are inherited as optional from Partial<Omit<...>>
}

/**
 * @class UpdateSpaceUseCase
 * @description Use case responsible for updating an existing {@link Space}.
 * It fetches the current space, applies provided changes, validates input (e.g., non-empty name),
 * and then saves the space back using the {@link ISpaceRepository}.
 * Core identifying properties like `id`, `date`, and `creationDate` are not modified.
 */
export class UpdateSpaceUseCase {
  /**
   * Constructs the UpdateSpaceUseCase.
   * @param {ISpaceRepository} spaceRepository - The repository for space data.
   */
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  /**
   * Executes the use case to update a space.
   * @param {UpdateSpaceInputDTO} data - The input data containing the ID of the space and fields to update.
   * @returns {Promise<Space>} A promise that resolves to the updated {@link Space} entity.
   * @throws {Error} If the space with the given ID is not found.
   * @throws {Error} If the updated space name is empty or only whitespace.
   * @description This method performs the following steps:
   * 1. Fetches the `existingSpace` using `spaceRepository.findById`. Throws error if not found.
   * 2. Creates an `updatedSpace` object by copying `existingSpace`.
   * 3. Applies updates from `data` to `updatedSpace` for fields like `name`, `description`, `goal`, `tags`, `colorScheme`.
   *    - `name` is trimmed.
   *    - `description` and `goal` are trimmed if provided; `null` input clears them (sets to `undefined`).
   *    - `tags` are trimmed and empty tags are filtered out.
   * 4. Validates that the `updatedSpace.name` is not empty. Throws error if it is.
   * 5. Saves the `updatedSpace` using `spaceRepository.save`.
   * 6. Returns the updated and persisted space.
   */
  async execute(data: UpdateSpaceInputDTO): Promise<Space> {
    const existingSpace = await this.spaceRepository.findById(data.id);
    if (!existingSpace) {
      throw new Error('Space not found for update.');
    }

    // Create a mutable copy, preserving immutable fields like id, date, creationDate
    const updatedSpace: Space = {
      ...existingSpace,
    };

    // Apply updates for provided and mutable fields
    if (data.name !== undefined) {
      updatedSpace.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updatedSpace.description = data.description === null ? undefined : data.description.trim();
    }
    if (data.goal !== undefined) {
      updatedSpace.goal = data.goal === null ? undefined : data.goal.trim();
    }
    if (data.tags !== undefined) {
      updatedSpace.tags = data.tags.map(tag => tag.trim()).filter(tag => tag);
    }
    if (data.colorScheme !== undefined) {
      updatedSpace.colorScheme = data.colorScheme;
    }

    // Validate essential fields like name after updates
    if (!updatedSpace.name) {
        throw new Error('Space name cannot be empty.');
    }

    return this.spaceRepository.save(updatedSpace);
  }
}
