// src/application/use-cases/space/create-space.usecase.ts
/**
 * @file Implements the use case for creating a new Space.
 * This use case handles the business logic for instantiating a {@link Space} entity
 * for a specific date and persisting it.
 */

import type { Space } from '@/domain/entities';
import type { ISpaceRepository } from '@/application/ports/repositories';

/**
 * @interface CreateSpaceInputDTO
 * @description Data Transfer Object for creating a new space.
 * It omits system-generated fields like 'id' and 'creationDate'.
 * The 'date' for which the space is being created is passed separately to the `execute` method.
 * @extends {Omit<Space, 'id' | 'creationDate' | 'date'>}
 */
export interface CreateSpaceInputDTO extends Omit<Space, 'id' | 'creationDate' | 'date'> {
  // Currently, all properties are covered by Omit. Add specific overrides if needed.
  // e.g. name: string; description?: string; tags?: string[]; colorScheme?: string; goal?: string;
}

/**
 * @class CreateSpaceUseCase
 * @description Use case responsible for creating a new {@link Space}.
 * It takes user-provided details, combines them with system-generated values (ID, creation date),
 * and uses the {@link ISpaceRepository} to save the new space.
 */
export class CreateSpaceUseCase {
  /**
   * Constructs the CreateSpaceUseCase.
   * @param {ISpaceRepository} spaceRepository - The repository for space data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  /**
   * Executes the use case to create a new space.
   * @param {CreateSpaceInputDTO & { date: string }} data - The input data for the new space,
   * including all properties from {@link CreateSpaceInputDTO} and an explicit `date` string (YYYY-MM-DD).
   * @returns {Promise<Space>} A promise that resolves to the newly created and persisted {@link Space} entity.
   * @throws {Error} If the `date` property is not provided in the input data.
   * @description This method performs the following steps:
   * 1. Validates that `data.date` is provided. Throws an error if it's missing.
   * 2. Constructs a new {@link Space} entity by:
   *    - Spreading properties from the input `data`.
   *    - Generating a unique `id` using `self.crypto.randomUUID()`.
   *    - Setting `creationDate` to the current date and time in ISO format.
   *    - Ensuring `tags` is an array (defaults to an empty array if not provided).
   * 3. Calls `spaceRepository.save` to persist the new space.
   * 4. Returns the persisted space.
   */
  async execute(data: CreateSpaceInputDTO & { date: string }): Promise<Space> {
    if (!data.date) {
      throw new Error('Date is required to create a space.');
    }
    const newSpace: Space = {
      ...data, // Spreads name, description, tags, colorScheme, goal, and the explicit date
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      tags: data.tags || [], // Ensure tags is always an array
    };
    return this.spaceRepository.save(newSpace);
  }
}
