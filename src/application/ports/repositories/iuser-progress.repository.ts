// src/application/ports/repositories/iuser-progress.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link UserProgress} entity.
 * This interface is part of the application layer's ports, abstracting data persistence for user gamification data.
 */

import type { UserProgress } from '@/domain/entities/user-progress.entity';

/**
 * @interface IUserProgressRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link UserProgress} entities. It serves as an abstraction (port) enabling the application
 * layer to manage user progress data (like points and levels) independently of the database technology.
 */
export interface IUserProgressRepository {
  /**
   * Finds UserProgress by the user's unique identifier.
   * @param {string} userId - The unique ID of the user whose progress is to be found.
   * @returns {Promise<UserProgress | null>} A promise that resolves to the UserProgress if found, or null otherwise.
   */
  findByUserId(userId: string): Promise<UserProgress | null>;

  /**
   * Saves UserProgress to the persistence layer.
   * This method handles both creation of new user progress records and updates to existing ones.
   * @param {UserProgress} userProgress - The UserProgress entity to save.
   * @returns {Promise<UserProgress>} A promise that resolves to the saved UserProgress.
   */
  save(userProgress: UserProgress): Promise<UserProgress>;

  /**
   * Clears all UserProgress data from the persistence layer.
   * This is typically used for full data resets or during testing.
   * @returns {Promise<void>} A promise that resolves when all user progress data has been cleared.
   */
  clearAll(): Promise<void>;
}
