// src/domain/entities/problem.entity.ts

/**
 * Represents a logged problem, waste, or blocker.
 */
export interface Problem {
  id: string;
  spaceId: string;
  type: 'Waste' | 'Blocker' | 'Issue'; // Type of problem
  description: string;
  timestamp: string; // ISO date string (creation)
  lastModifiedDate: string; // ISO date string
  resolved: boolean;
  resolutionNotes?: string; // Optional notes when resolving
}
