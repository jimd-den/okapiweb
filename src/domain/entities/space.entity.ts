// src/domain/entities/space.entity.ts

/**
 * Represents a work category or project area.
 * Each space can have its own tasks, problems, and progress tracking.
 */
export interface Space {
  id: string;
  name: string;
  description?: string;
  creationDate: string; // ISO date string
  tags: string[];
  colorScheme?: string; // Identifier for a predefined or custom color scheme
  goal?: string; // Current primary goal for this space
  sequentialSteps?: boolean; // Whether actions in this space are typically sequential
}
