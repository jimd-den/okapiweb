// src/domain/entities/todo.entity.ts

/**
 * Represents a to-do item within a space.
 */
export interface Todo {
  id: string;
  spaceId: string;
  description: string;
  beforeImageUrl?: string; // Field kept for future expansion
  afterImageUrl?: string;  // Field kept for future expansion
  completed: boolean;
  creationDate: string; // ISO date string
  completionDate?: string; // ISO date string
  lastModifiedDate: string; // ISO date string
  order?: number; // For manual sorting if implemented later
}
