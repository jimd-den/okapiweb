// src/domain/entities/todo.entity.ts

/**
 * @file Defines the Todo entity, representing a task or to-do item.
 */

/**
 * @typedef TodoStatus
 * @description A type alias representing the possible states of a {@link Todo} item.
 * - 'todo': The task is pending and has not been started.
 * - 'doing': The task is currently in progress.
 * - 'done': The task has been completed.
 */
export type TodoStatus = 'todo' | 'doing' | 'done';

/**
 * @interface Todo
 * @description Represents a single task or to-do item that a user needs to accomplish.
 * Todos are typically associated with a specific 'Space' and help users track their
 * pending work, ongoing activities, and completed tasks.
 * Its purpose is to provide a structured way to manage individual tasks.
 */
export interface Todo {
  /** @property {string} id - A unique identifier for this to-do item. */
  id: string;
  /** @property {string} spaceId - The identifier of the 'Space' to which this to-do item belongs, linking it to a specific context or project. */
  spaceId: string;
  /** @property {string} description - A textual description of the task to be done. */
  description: string;
  /** @property {TodoStatus} status - The current status of the to-do item (e.g., 'todo', 'doing', 'done'). */
  status: TodoStatus;
  /** @property {string} [beforeImageDataUri] - Optional. A string containing a data URI for an image taken or uploaded by the user before starting the task, perhaps to document the initial state. */
  beforeImageDataUri?: string;
  /** @property {string} [afterImageDataUri] - Optional. A string containing a data URI for an image taken or uploaded by the user after completing the task, perhaps to document the final result. */
  afterImageDataUri?: string;
  /** @property {boolean} completed - A flag indicating whether the to-do item is completed. This should be kept in sync with `status === 'done'`. While `status` provides more granular states, `completed` offers a quick boolean check. */
  completed: boolean;
  /** @property {string} creationDate - An ISO date string representing when this to-do item was created. */
  creationDate: string;
  /** @property {string} [completionDate] - Optional. An ISO date string representing when this to-do item was marked as 'done'. This is set when the status transitions to 'done'. */
  completionDate?: string;
  /** @property {string} lastModifiedDate - An ISO date string indicating when this to-do item was last modified (e.g., description updated, status changed). */
  lastModifiedDate: string;
  /** @property {number} [order] - Optional. A number that can be used for manual sorting of to-do items if such a feature is implemented. Lower numbers would typically appear first. */
  order?: number;
}
