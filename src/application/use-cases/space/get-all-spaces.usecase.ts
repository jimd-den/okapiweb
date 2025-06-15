// src/application/use-cases/space/get-all-spaces.usecase.ts
/**
 * @file Implements the use case for retrieving all Spaces.
 * This use case provides a way to fetch every {@link Space} entity stored in the system.
 */

import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

/**
 * @class GetAllSpacesUseCase
 * @description Use case responsible for fetching all {@link Space} entities.
 * It directly utilizes the {@link ISpaceRepository} to retrieve the data.
 * The repository implementation will determine the default order of the returned spaces.
 */
export class GetAllSpacesUseCase {
  /**
   * Constructs the GetAllSpacesUseCase.
   * @param {ISpaceRepository} spaceRepository - The repository for space data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  /**
   * Executes the use case to get all spaces.
   * @returns {Promise<Space[]>} A promise that resolves to an array of all {@link Space} entities.
   * The order of spaces is determined by the repository's `getAll` implementation.
   * @description This method simply calls `spaceRepository.getAll()` to retrieve all spaces.
   * No additional business logic or sorting is applied at this use case level.
   */
  async execute(): Promise<Space[]> {
    return this.spaceRepository.getAll();
  }
}
