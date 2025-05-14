// src/domain/entities/todo.entity.ts

/**
 * Represents a to-do item within a space.
 */
export interface Todo {
  id: string;
  spaceId: string;
  description: string;
  beforeImageDataUri?: string; // Data URI for an image taken before starting the task
  afterImageDataUri?: string;  // Data URI for an image taken after completing the task
  completed: boolean;
  creationDate: string; // ISO date string
  completionDate?: string; // ISO date string
  lastModifiedDate: string; // ISO date string
  order?: number; // For manual sorting if implemented later
}
