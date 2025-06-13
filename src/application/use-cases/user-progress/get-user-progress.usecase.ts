// src/application/use-cases/user-progress/get-user-progress.usecase.ts
/**
 * @file Implements the use case for retrieving a user's progress (points, level, etc.).
 * This use case handles fetching user progress and ensures that a default progress state
 * is created and saved if one doesn't exist for the default user.
 */

import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID } from '@/lib/constants'; // Assumes a default user ID for single-user context

/**
 * @class GetUserProgressUseCase
 * @description Use case responsible for fetching a user's {@link UserProgress}.
 * If no progress is found for the `DEFAULT_USER_ID`, it initializes and saves a default
 * progress record before returning it. This ensures the default user always has a progress state.
 */
export class GetUserProgressUseCase {
  /**
   * Constructs the GetUserProgressUseCase.
   * @param {IUserProgressRepository} userProgressRepository - The repository for user progress data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly userProgressRepository: IUserProgressRepository) {}

  /**
   * Executes the use case to get user progress.
   * @param {string} [userId=DEFAULT_USER_ID] - The ID of the user whose progress is to be retrieved.
   * Defaults to `DEFAULT_USER_ID` for applications primarily designed for a single local user.
   * @returns {Promise<UserProgress | null>} A promise that resolves to the {@link UserProgress} entity
   * for the specified user. Returns the newly created default progress if it was initialized for the default user.
   * Returns `null` if `userId` is provided (not default) and no progress is found.
   * @description This method performs the following steps:
   * 1. Calls `userProgressRepository.findByUserId` to fetch the user's progress.
   * 2. If no progress is found (`!progress`) AND the `userId` is the `DEFAULT_USER_ID`:
   *    - Creates a new default `UserProgress` object (level 1, 0 points, no customizations).
   *    - Saves this new default progress record using `userProgressRepository.save`.
   *    - Sets `progress` to this newly created default record.
   * 3. Returns the fetched or newly created `progress`.
   */
  async execute(userId: string = DEFAULT_USER_ID): Promise<UserProgress | null> {
    let progress = await this.userProgressRepository.findByUserId(userId);

    // If no progress record exists specifically for the DEFAULT_USER_ID, create one.
    if (!progress && userId === DEFAULT_USER_ID) {
      // Initialize a default progress state for the default user.
      progress = {
        userId: DEFAULT_USER_ID,
        points: 0,
        level: 1,
        unlockedCustomizations: []
      };
      // Persist this default state so it's available for subsequent calls.
      await this.userProgressRepository.save(progress);
    }
    // For any other userId (not DEFAULT_USER_ID), if progress is not found, null will be returned as per findByUserId contract.
    return progress;
  }
}
