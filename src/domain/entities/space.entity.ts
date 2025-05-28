// src/domain/entities/space.entity.ts

/**
 * Represents a work category or project area, now designated to a specific date.
 */
export interface Space {
  id: string;
  name: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  creationDate: string; // ISO date string of when the original space record was created
  tags: string[];
  colorScheme?: string; // Identifier for a predefined or custom color scheme
  goal?: string; // Current primary goal for this space
}
