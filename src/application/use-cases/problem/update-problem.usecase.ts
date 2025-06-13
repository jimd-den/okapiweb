// src/application/use-cases/problem/update-problem.usecase.ts
/**
 * @file Implements the use case for updating an existing problem log.
 * This use case allows modification of various properties of a {@link Problem} entity,
 * such as its description, type, resolution status, and associated image.
 */

import type { Problem } from '@/domain/entities';
import type { IProblemRepository } from '@/application/ports/repositories';

/**
 * @interface UpdateProblemInputDTO
 * @description Data Transfer Object for updating a problem log.
 * Requires the `id` of the problem to update. All other properties are optional
 * and will only be applied if provided in the input.
 */
export interface UpdateProblemInputDTO {
  /** @property {string} id - The unique identifier of the problem to update. */
  id: string;
  /** @property {string} [description] - Optional new description for the problem. If provided and empty after trim, an error is thrown. */
  description?: string;
  /** @property {'Waste' | 'Blocker' | 'Issue'} [type] - Optional new type for the problem. */
  type?: 'Waste' | 'Blocker' | 'Issue';
  /** @property {boolean} [resolved] - Optional new resolution status. */
  resolved?: boolean;
  /** @property {string} [resolutionNotes] - Optional notes detailing the resolution. Can be an empty string to clear existing notes. */
  resolutionNotes?: string;
  /** @property {string | null} [imageDataUri] - Optional new image data URI. If `null`, any existing image URI will be removed. If `undefined`, it's not changed. */
  imageDataUri?: string | null;
}

/**
 * @class UpdateProblemUseCase
 * @description Use case responsible for updating an existing {@link Problem} log.
 * It fetches the current problem, applies the provided changes, validates input (e.g., non-empty description),
 * updates the `lastModifiedDate`, and then saves the problem back using the {@link IProblemRepository}.
 */
export class UpdateProblemUseCase {
  /**
   * Constructs the UpdateProblemUseCase.
   * @param {IProblemRepository} problemRepository - The repository for problem data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly problemRepository: IProblemRepository) {}

  /**
   * Executes the use case to update a problem log.
   * @param {UpdateProblemInputDTO} data - The input data containing the ID of the problem and the fields to update.
   * @returns {Promise<Problem>} A promise that resolves to the updated {@link Problem} entity.
   * @throws {Error} If the problem with the given ID is not found.
   * @throws {Error} If the description is provided but is empty after trimming.
   * @description This method performs the following steps:
   * 1. Fetches the existing problem using `problemRepository.findById`. Throws error if not found.
   * 2. Creates a mutable copy (`updatedProblem`) of the `existingProblem`.
   * 3. Iteratively checks each optional field in the `data` DTO:
   *    - If `data.description` is provided, it's trimmed. If empty after trim, an error is thrown. Otherwise, `updatedProblem.description` is set.
   *    - If `data.type` is provided, `updatedProblem.type` is set.
   *    - If `data.resolved` is provided, `updatedProblem.resolved` is set.
   *    - If `data.resolutionNotes` is provided, it's trimmed. If empty, `updatedProblem.resolutionNotes` becomes `undefined` (cleared), otherwise it's set.
   *    - If `data.imageDataUri` is provided:
   *        - If `null`, `updatedProblem.imageDataUri` is set to `undefined` (cleared).
   *        - Otherwise, `updatedProblem.imageDataUri` is set to the provided URI.
   * 4. Updates `updatedProblem.lastModifiedDate` to the current date and time.
   * 5. Saves the `updatedProblem` using `problemRepository.save`.
   * 6. Returns the updated and persisted problem.
   */
  async execute(data: UpdateProblemInputDTO): Promise<Problem> {
    const existingProblem = await this.problemRepository.findById(data.id);
    if (!existingProblem) {
      throw new Error('Problem not found.');
    }

    // Create a mutable copy to update
    const updatedProblem: Problem = { ...existingProblem };

    // Apply updates for provided fields
    if (data.description !== undefined) {
      if (!data.description.trim()) {
        throw new Error('Problem description cannot be empty.');
      }
      updatedProblem.description = data.description.trim();
    }
    if (data.type !== undefined) {
      updatedProblem.type = data.type;
    }
    if (data.resolved !== undefined) {
      updatedProblem.resolved = data.resolved;
    }
    if (data.resolutionNotes !== undefined) {
      // Allow clearing notes by passing an empty string
      updatedProblem.resolutionNotes = data.resolutionNotes.trim() || undefined;
    }
    // Handle imageDataUri: undefined means no change, null means clear, string means update
    if (data.imageDataUri !== undefined) {
      updatedProblem.imageDataUri = data.imageDataUri === null ? undefined : data.imageDataUri;
    }
    
    // Always update the last modified date on any change
    updatedProblem.lastModifiedDate = new Date().toISOString();

    return this.problemRepository.save(updatedProblem);
  }
}
