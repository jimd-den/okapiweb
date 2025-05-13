// src/domain/entities/action.entity.ts

/**
 * Represents a logged piece of work or task completed.
 */
export interface Action {
  id: string;
  spaceId: string;
  description: string;
  timestamp: string; // ISO date string
  points: number; // Gamification points awarded for this action
}
