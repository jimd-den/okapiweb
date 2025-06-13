// src/application/use-cases/problem/delete-problem.usecase.ts
/**
 * @file Implements the use case for deleting a problem log.
 * This use case ensures that a problem exists before attempting to delete it.
 */

import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';

/**
 * @class DeleteProblemUseCase
 * @description Use case responsible for deleting an existing {@link Problem} log.
 * It validates the existence of the problem before instructing the repository to delete it.
 */
export class DeleteProblemUseCase {
  /**
   * Constructs the DeleteProblemUseCase.
   * @param {IProblemRepository} problemRepository - The repository for problem data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly problemRepository: IProblemRepository) {}

  /**
   * Executes the use case to delete a problem log.
   * @param {string} id - The unique identifier of the problem to be deleted.
   * @returns {Promise<void>} A promise that resolves when the problem has been successfully deleted.
   * @throws {Error} If the problem with the given ID is not found.
   * @description This method performs the following steps:
   * 1. Retrieves the problem by its ID using `problemRepository.findById` to ensure it exists.
   * 2. If the problem is not found, it throws an error.
   * 3. Calls `problemRepository.delete` to remove the problem from persistence.
   */
  async execute(id: string): Promise<void> {
    const existingProblem = await this.problemRepository.findById(id);
    if (!existingProblem) {
      // Ensure the problem exists before attempting deletion.
      throw new Error('Problem not found for deletion.');
    }
    return this.problemRepository.delete(id);
  }
}
