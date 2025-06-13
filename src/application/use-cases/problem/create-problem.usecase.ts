// src/application/use-cases/problem/create-problem.usecase.ts
/**
 * @file Implements the use case for creating a new problem log (e.g., Waste, Blocker, Issue).
 * This use case handles the creation and initial persistence of a {@link Problem} entity.
 */

import type { Problem } from '@/domain/entities';
import type { IProblemRepository } from '@/application/ports/repositories';

/**
 * @interface CreateProblemInputDTO
 * @description Data Transfer Object for creating a new problem.
 * It contains all user-provided information needed to instantiate a {@link Problem} entity.
 */
export interface CreateProblemInputDTO {
  /** @property {string} spaceId - The ID of the space where the problem is being logged. */
  spaceId: string;
  /** @property {'Waste' | 'Blocker' | 'Issue'} type - The type or classification of the problem. */
  type: 'Waste' | 'Blocker' | 'Issue';
  /** @property {string} description - A textual description of the problem. */
  description: string;
  /** @property {string} [imageDataUri] - Optional. A data URI for an image associated with the problem. */
  imageDataUri?: string;
}

/**
 * @class CreateProblemUseCase
 * @description Use case responsible for creating and saving a new {@link Problem} log.
 * It validates required input (like description), sets initial values (ID, timestamps, resolved status),
 * and then uses the {@link IProblemRepository} to persist the new problem.
 */
export class CreateProblemUseCase {
  /**
   * Constructs the CreateProblemUseCase.
   * @param {IProblemRepository} problemRepository - The repository for problem data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly problemRepository: IProblemRepository) {}

  /**
   * Executes the use case to create a new problem log.
   * @param {CreateProblemInputDTO} data - The input data for the problem to be created.
   * @returns {Promise<Problem>} A promise that resolves to the newly created and persisted {@link Problem} entity.
   * @throws {Error} If the problem description is empty or only whitespace.
   * @description This method performs the following steps:
   * 1. Validates that `data.description` is not empty after trimming whitespace. Throws an error if it is.
   * 2. Generates a unique `id` for the new problem using `self.crypto.randomUUID()`.
   * 3. Sets the `timestamp` and `lastModifiedDate` to the current date and time.
   * 4. Initializes `resolved` status to `false`.
   * 5. Constructs a new {@link Problem} entity using the input data and generated values.
   * 6. Calls `problemRepository.save` to persist the new problem.
   * 7. Returns the persisted problem.
   */
  async execute(data: CreateProblemInputDTO): Promise<Problem> {
    if (!data.description.trim()) {
      throw new Error('Problem description cannot be empty.');
    }

    const now = new Date().toISOString();
    const newProblem: Problem = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      type: data.type,
      description: data.description.trim(), // Ensure description is trimmed
      timestamp: now, // Creation timestamp
      lastModifiedDate: now, // Initially same as creation
      resolved: false, // New problems are unresolved by default
      imageDataUri: data.imageDataUri, // Optional image
      // resolutionNotes is undefined by default
    };

    return this.problemRepository.save(newProblem);
  }
}
