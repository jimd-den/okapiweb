// src/domain/entities/todo.entity.ts

/**
 * Represents a to-do item within a space.
 */

export type TodoStatus = 'todo' | 'doing' | 'done';

export interface Todo {
  id: string;
  spaceId: string;
  description: string;
  status: TodoStatus; // New status field
  beforeImageDataUri?: string; // Data URI for an image taken before starting the task
  afterImageDataUri?: string;  // Data URI for an image taken after completing the task
  completed: boolean; // Will be kept in sync with status === 'done'
  creationDate: string; // ISO date string
  completionDate?: string; // ISO date string, set when status becomes 'done'
  lastModifiedDate: string; // ISO date string
  order?: number; // For manual sorting if implemented later
}
