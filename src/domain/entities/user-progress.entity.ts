// src/domain/entities/user-progress.entity.ts

/**
 * Represents the user's gamified progress.
 */
export interface UserProgress {
  userId: string; // Could be a default 'localUser' for single-user IndexedDB app
  points: number;
  level: number;
  unlockedCustomizations: string[]; // e.g., ['colorScheme_ocean', 'theme_dark']
}
