// src/domain/entities/todo.entity.ts

/**
 * Represents a to-do item within a space.
 */
export interface Todo {
  id: string;
  spaceId: string;
  description: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  completed: boolean;
  creationDate: string; // ISO date string
  completionDate?: string; // ISO date string
}
