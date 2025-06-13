// src/application/ports/repositories/iproblem.repository.ts
/**
 * @file Defines the contract (interface) for repository operations related to the {@link Problem} entity.
 * This interface is part of the application layer's ports, abstracting data persistence for problems/issues.
 */

import type { Problem } from '@/domain/entities/problem.entity';

/**
 * @interface IProblemRepository
 * @description An interface that defines the methods for interacting with the persistence layer
 * for {@link Problem} entities. It serves as an abstraction (port) allowing the application
 * layer to manage problem logs without direct dependency on the database technology.
 */
export interface IProblemRepository {
  /**
   * Finds a Problem by its unique identifier.
   * @param {string} id - The unique ID of the problem to find.
   * @returns {Promise<Problem | null>} A promise that resolves to the Problem if found, or null otherwise.
   */
  findById(id: string): Promise<Problem | null>;

  /**
   * Finds all Problems associated with a specific space.
   * @param {string} spaceId - The ID of the space for which to retrieve problems.
   * @returns {Promise<Problem[]>} A promise that resolves to an array of Problems.
   */
  findBySpaceId(spaceId: string): Promise<Problem[]>;

  /**
   * Retrieves all Problems from the persistence layer.
   * Useful for global views, data analysis, or administrative tasks.
   * @returns {Promise<Problem[]>} A promise that resolves to an array of all Problems.
   */
  getAll(): Promise<Problem[]>;

  /**
   * Saves a Problem to the persistence layer.
   * This method handles both creation of new problems and updates to existing ones.
   * @param {Problem} problem - The Problem entity to save.
   * @returns {Promise<Problem>} A promise that resolves to the saved Problem.
   */
  save(problem: Problem): Promise<Problem>;

  /**
   * Deletes a Problem from the persistence layer by its unique identifier.
   * @param {string} id - The unique ID of the problem to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all Problems associated with a specific space.
   * Important for data cleanup when a space is removed.
   * @param {string} spaceId - The ID of the space whose problems are to be deleted.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  deleteBySpaceId(spaceId: string): Promise<void>;

  /**
   * Clears all Problems from the persistence layer.
   * This is typically used for full data resets or during testing.
   * @returns {Promise<void>} A promise that resolves when all problems have been cleared.
   */
  clearAll(): Promise<void>;
}
