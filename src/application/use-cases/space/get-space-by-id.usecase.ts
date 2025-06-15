// src/application/use-cases/space/get-space-by-id.usecase.ts
/**
 * @file Implements the use case for retrieving a specific Space by its unique identifier.
 * This use case allows fetching the details of a single {@link Space} entity.
 */

import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

/**
 * @class GetSpaceByIdUseCase
 * @description Use case responsible for fetching a specific {@link Space} by its ID.
 * It utilizes the {@link ISpaceRepository} to perform the data retrieval.
 */
export class GetSpaceByIdUseCase {
  /**
   * Constructs the GetSpaceByIdUseCase.
   * @param {ISpaceRepository} spaceRepository - The repository for space data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  /**
   * Executes the use case to get a space by its ID.
   * @param {string} id - The unique identifier of the space to retrieve.
   * @returns {Promise<Space | null>} A promise that resolves to the {@link Space} entity if found,
   * or `null` if no space exists with the given ID.
   * @description This method calls `spaceRepository.findById` to fetch the space.
   */
  async execute(id: string): Promise<Space | null> {
    return this.spaceRepository.findById(id);
  }
}
