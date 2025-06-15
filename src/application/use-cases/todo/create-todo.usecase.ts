// src/application/use-cases/todo/create-todo.usecase.ts
/**
 * @file Implements the use case for creating a new To-do item.
 * This use case handles the instantiation of a {@link Todo} entity with initial values
 * and its persistence via a repository.
 */

import type { Todo, TodoStatus } from '@/domain/entities';
import type { ITodoRepository } from '@/application/ports/repositories';

/**
 * @interface CreateTodoInputDTO
 * @description Data Transfer Object for creating a new to-do item.
 * It contains user-provided information such as description, associated space,
 * optional order, and an optional image taken before starting the task.
 */
export interface CreateTodoInputDTO {
  /** @property {string} spaceId - The ID of the space this to-do item belongs to. */
  spaceId: string;
  /** @property {string} description - The textual description of the to-do item. */
  description: string;
  /** @property {number} [order] - Optional. A number for manual sorting if implemented. */
  order?: number;
  /** @property {string} [beforeImageDataUri] - Optional. Data URI for an image associated with the to-do before starting. */
  beforeImageDataUri?: string;
}

/**
 * @class CreateTodoUseCase
 * @description Use case responsible for creating and saving a new {@link Todo} item.
 * It validates essential input (like a non-empty description), sets default values for
 * new to-dos (e.g., status 'todo', completed 'false', timestamps), and uses the
 * {@link ITodoRepository} to persist the entity.
 */
export class CreateTodoUseCase {
  /**
   * Constructs the CreateTodoUseCase.
   * @param {ITodoRepository} todoRepository - The repository for to-do item data.
   * This dependency is injected to abstract data persistence.
   */
  constructor(private readonly todoRepository: ITodoRepository) {}

  /**
   * Executes the use case to create a new to-do item.
   * @param {CreateTodoInputDTO} data - The input data for the to-do item to be created.
   * @returns {Promise<Todo>} A promise that resolves to the newly created and persisted {@link Todo} entity.
   * @throws {Error} If the to-do description is empty or only whitespace.
   * @description This method performs the following steps:
   * 1. Validates that `data.description` is not empty (after trimming). Throws an error if it is.
   * 2. Generates a unique `id` for the new to-do using `self.crypto.randomUUID()`.
   * 3. Sets the current date and time for `creationDate` and `lastModifiedDate`.
   * 4. Initializes `status` to 'todo' and `completed` to `false`.
   * 5. Constructs a new {@link Todo} entity using input data and generated/defaulted values.
   * 6. Calls `todoRepository.save` to persist the new to-do item.
   * 7. Returns the persisted to-do item.
   */
  async execute(data: CreateTodoInputDTO): Promise<Todo> {
    if (!data.description.trim()) {
      throw new Error('Todo description cannot be empty.');
    }

    const now = new Date().toISOString();
    const newTodo: Todo = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      description: data.description.trim(), // Ensure description is trimmed
      status: 'todo', // Default status for new to-dos
      completed: false, // New to-dos are not completed
      creationDate: now,
      lastModifiedDate: now, // Initially same as creation
      order: data.order, // Optional, can be undefined
      beforeImageDataUri: data.beforeImageDataUri, // Optional
      // completionDate and afterImageDataUri are undefined by default
    };

    return this.todoRepository.save(newTodo);
  }
}
