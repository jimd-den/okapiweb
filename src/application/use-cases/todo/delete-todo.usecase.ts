// src/application/use-cases/todo/delete-todo.usecase.ts
/**
 * @file Implements the use case for deleting a To-do item.
 * This use case ensures a To-do item exists before attempting its deletion.
 */

import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

/**
 * @class DeleteTodoUseCase
 * @description Use case responsible for deleting an existing {@link Todo} item.
 * It validates the existence of the to-do item before instructing the repository to delete it.
 */
export class DeleteTodoUseCase {
  /**
   * Constructs the DeleteTodoUseCase.
   * @param {ITodoRepository} todoRepository - The repository for to-do item data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly todoRepository: ITodoRepository) {}

  /**
   * Executes the use case to delete a to-do item.
   * @param {string} id - The unique identifier of the to-do item to be deleted.
   * @returns {Promise<void>} A promise that resolves when the to-do item has been successfully deleted.
   * @throws {Error} If the to-do item with the given ID is not found.
   * @description This method performs the following steps:
   * 1. Retrieves the to-do item by its ID using `todoRepository.findById` to ensure it exists.
   * 2. If the to-do item is not found, it throws an error. (Alternatively, it could succeed silently
   *    depending on desired application behavior, but explicit error is chosen here).
   * 3. Calls `todoRepository.delete` to remove the to-do item from persistence.
   */
  async execute(id: string): Promise<void> {
    const existingTodo = await this.todoRepository.findById(id);
    if (!existingTodo) {
      // Explicitly check if the to-do exists before attempting deletion.
      // Depending on requirements, this could be a silent success if not found.
      throw new Error('Todo not found for deletion.');
    }
    return this.todoRepository.delete(id);
  }
}
