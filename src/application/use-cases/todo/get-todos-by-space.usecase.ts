// src/application/use-cases/todo/get-todos-by-space.usecase.ts
/**
 * @file Implements the use case for retrieving all To-do items associated with a specific Space.
 * This use case relies on the repository to fetch and potentially sort the to-do items.
 */

import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

/**
 * @class GetTodosBySpaceUseCase
 * @description Use case responsible for fetching all {@link Todo} items that belong to a given space.
 * It utilizes an {@link ITodoRepository} to retrieve the data. The repository implementation
 * is expected to handle any default sorting (e.g., by status then by creation date).
 */
export class GetTodosBySpaceUseCase {
  /**
   * Constructs the GetTodosBySpaceUseCase.
   * @param {ITodoRepository} todoRepository - The repository for accessing to-do item data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly todoRepository: ITodoRepository) {}

  /**
   * Executes the use case to get to-do items for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve to-do items.
   * @returns {Promise<Todo[]>} A promise that resolves to an array of {@link Todo} entities.
   * The order of items is determined by the repository's `findBySpaceId` implementation.
   * @description This method directly calls `todoRepository.findBySpaceId` to fetch the to-do items.
   * Any specific sorting or filtering logic beyond what `findBySpaceId` provides would typically be
   * handled by the repository or potentially added here if use-case specific.
   */
  async execute(spaceId: string): Promise<Todo[]> {
    return this.todoRepository.findBySpaceId(spaceId);
  }
}
