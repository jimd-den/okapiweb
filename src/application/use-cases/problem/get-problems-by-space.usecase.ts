// src/application/use-cases/problem/get-problems-by-space.usecase.ts
/**
 * @file Implements the use case for retrieving all problem logs associated with a specific space.
 * This use case relies on the repository to fetch and potentially sort the problems.
 */

import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';

/**
 * @class GetProblemsBySpaceUseCase
 * @description Use case responsible for fetching all {@link Problem} logs that belong to a given space.
 * It uses an {@link IProblemRepository} to retrieve the data. The repository implementation
 * is expected to handle any default sorting (e.g., by unresolved status then by date).
 */
export class GetProblemsBySpaceUseCase {
  /**
   * Constructs the GetProblemsBySpaceUseCase.
   * @param {IProblemRepository} problemRepository - The repository for accessing problem data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly problemRepository: IProblemRepository) {}

  /**
   * Executes the use case to get problem logs for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve problems.
   * @returns {Promise<Problem[]>} A promise that resolves to an array of {@link Problem} entities.
   * The order of problems is determined by the repository's `findBySpaceId` implementation
   * (e.g., typically unresolved first, then sorted by creation date).
   * @description This method directly calls `problemRepository.findBySpaceId` to fetch the problems.
   * Any specific sorting or filtering logic beyond what `findBySpaceId` provides would be added here
   * or in the repository itself.
   */
  async execute(spaceId: string): Promise<Problem[]> {
    return this.problemRepository.findBySpaceId(spaceId);
  }
}
