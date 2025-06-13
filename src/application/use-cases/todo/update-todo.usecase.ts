// src/application/use-cases/todo/update-todo.usecase.ts
/**
 * @file Implements the use case for updating an existing To-do item.
 * This use case handles modifications to a To-do's properties, including its status,
 * description, associated images, and order. It also manages the interplay between
 * `status` and `completed` flags.
 */

import type { Todo, TodoStatus } from '@/domain/entities';
import type { ITodoRepository } from '@/application/ports/repositories';

/**
 * @interface UpdateTodoInputDTO
 * @description Data Transfer Object for updating a to-do item.
 * Requires the `id` of the to-do to update. All other properties are optional
 * and will only be applied if provided in the input.
 * `beforeImageDataUri` and `afterImageDataUri` can be set to `null` to explicitly clear them.
 */
export interface UpdateTodoInputDTO {
  /** @property {string} id - The unique identifier of the to-do item to update. */
  id: string;
  /** @property {string} [description] - Optional new description. If provided and empty after trim, an error is thrown. */
  description?: string;
  /** @property {TodoStatus} [status] - Optional new status for the to-do item. */
  status?: TodoStatus;
  /** @property {boolean} [completed] - Optional new completion state. This is kept in sync with `status`. */
  completed?: boolean;
  /** @property {number} [order] - Optional new order for the to-do item. */
  order?: number;
  /** @property {string | null} [beforeImageDataUri] - Optional new 'before' image URI. `null` clears it, `undefined` leaves it unchanged. */
  beforeImageDataUri?: string | null;
  /** @property {string | null} [afterImageDataUri] - Optional new 'after' image URI. `null` clears it, `undefined` leaves it unchanged. */
  afterImageDataUri?: string | null;
}

/**
 * @class UpdateTodoUseCase
 * @description Use case responsible for updating an existing {@link Todo} item.
 * It fetches the current to-do, applies provided changes, validates input,
 * synchronizes `status` and `completed` fields, updates `lastModifiedDate`,
 * and then saves the to-do back using the {@link ITodoRepository}.
 */
export class UpdateTodoUseCase {
  /**
   * Constructs the UpdateTodoUseCase.
   * @param {ITodoRepository} todoRepository - The repository for to-do item data.
   */
  constructor(private readonly todoRepository: ITodoRepository) {}

  /**
   * Executes the use case to update a to-do item.
   * @param {UpdateTodoInputDTO} data - The input data containing the ID of the to-do and fields to update.
   * @returns {Promise<Todo>} A promise that resolves to the updated {@link Todo} entity.
   * @throws {Error} If the to-do item with the given ID is not found.
   * @throws {Error} If the description is provided but is empty after trimming.
   * @description This method performs the following steps:
   * 1. Fetches the `existingTodo` using `todoRepository.findById`. Throws error if not found.
   * 2. Creates a mutable copy (`updatedTodo`) of `existingTodo`.
   * 3. **Description Update**: If `data.description` is provided, trims it. Throws error if empty after trim. Updates `updatedTodo.description`.
   * 4. **Status and Completion Synchronization**:
   *    - If `data.status` is provided:
   *        - Sets `updatedTodo.status`.
   *        - If `status` is 'done', sets `updatedTodo.completed` to `true` and updates `updatedTodo.completionDate` (if not already set).
   *        - Otherwise, sets `updatedTodo.completed` to `false` and clears `updatedTodo.completionDate`.
   *    - Else if `data.completed` is provided (and `data.status` is not):
   *        - Sets `updatedTodo.completed`.
   *        - If `completed` is `true`, sets `updatedTodo.status` to 'done' and updates `updatedTodo.completionDate`.
   *        - If `completed` is `false`, sets `updatedTodo.status` to 'todo' (if it was 'done') or keeps existing status, and clears `updatedTodo.completionDate`.
   * 5. **Order Update**: If `data.order` is provided, updates `updatedTodo.order`.
   * 6. **Image URI Updates**:
   *    - If `data.beforeImageDataUri` is provided (`null` clears, string updates).
   *    - If `data.afterImageDataUri` is provided (`null` clears, string updates).
   * 7. Updates `updatedTodo.lastModifiedDate` to the current date and time.
   * 8. Saves `updatedTodo` using `todoRepository.save`.
   * 9. Returns the updated and persisted to-do.
   */
  async execute(data: UpdateTodoInputDTO): Promise<Todo> {
    const existingTodo = await this.todoRepository.findById(data.id);
    if (!existingTodo) {
      throw new Error('Todo not found.');
    }

    const updatedTodo: Todo = { ...existingTodo };

    // Handle description update
    if (data.description !== undefined) {
      if (!data.description.trim()) {
        throw new Error('Todo description cannot be empty.');
      }
      updatedTodo.description = data.description.trim();
    }

    // Handle status and completed state synchronization
    // If status is explicitly provided, it takes precedence for determining completion state.
    if (data.status !== undefined) {
      updatedTodo.status = data.status;
      if (data.status === 'done') {
        updatedTodo.completed = true;
        // Set completionDate only if it's not already set, or if re-completing.
        // This preserves the original completion date if a task is marked done, then undone, then done again.
        // However, standard behavior is often to update completionDate on any transition to 'done'.
        // For this implementation, we'll update/set it any time status becomes 'done'.
        updatedTodo.completionDate = new Date().toISOString(); // Or existingTodo.completionDate || new Date().toISOString();
      } else {
        updatedTodo.completed = false;
        updatedTodo.completionDate = undefined; // Clear completion date if not 'done'
      }
    } else if (data.completed !== undefined && data.status === undefined) {
      // If only 'completed' is provided, infer status.
      updatedTodo.completed = data.completed;
      if (data.completed) {
        updatedTodo.status = 'done';
        updatedTodo.completionDate = new Date().toISOString(); // Or existingTodo.completionDate || new Date().toISOString();
      } else {
        // If un-completing, revert status to 'todo' if it was 'done', otherwise keep its current non-'done' status.
        updatedTodo.status = existingTodo.status === 'done' ? 'todo' : existingTodo.status;
        updatedTodo.completionDate = undefined;
      }
    }
    
    // Handle order update
    if (data.order !== undefined) {
        updatedTodo.order = data.order;
    }

    // Handle image URI updates (allow clearing with null)
    if (data.beforeImageDataUri !== undefined) {
      updatedTodo.beforeImageDataUri = data.beforeImageDataUri === null ? undefined : data.beforeImageDataUri;
    }
    if (data.afterImageDataUri !== undefined) {
      updatedTodo.afterImageDataUri = data.afterImageDataUri === null ? undefined : data.afterImageDataUri;
    }

    // Always update the last modified date
    updatedTodo.lastModifiedDate = new Date().toISOString();

    return this.todoRepository.save(updatedTodo);
  }
}
