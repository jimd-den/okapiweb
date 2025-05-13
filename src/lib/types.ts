
// src/lib/types.ts

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
  // Relationships to other entities will be managed by ID
}

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

/**
 * Represents a logged problem, waste, or blocker.
 */
export interface Problem {
  id: string;
  spaceId: string;
  type: 'Waste' | 'Blocker' | 'Issue'; // Type of problem
  description: string;
  timestamp: string; // ISO date string
  resolved: boolean;
}

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

/**
 * Represents the user's gamified progress.
 */
export interface UserProgress {
  userId: string; // Could be a default 'localUser' for single-user IndexedDB app
  points: number;
  level: number;
  unlockedCustomizations: string[]; // e.g., ['colorScheme_ocean', 'theme_dark']
}

/**
 * Represents a clock-in/out event.
 */
export interface ClockEvent {
  id: string;
  type: 'clock-in' | 'clock-out';
  timestamp: string; // ISO date string
  spaceId?: string; // Optional: if clocking in/out for a specific space
}

/**
 * Represents an entire snapshot of the application's data for export/import.
 */
export interface AppDataExport {
  spaces: Space[];
  actions: Action[];
  problems: Problem[];
  todos: Todo[];
  userProgress: UserProgress;
  clockEvents: ClockEvent[];
  schemaVersion: string;
}