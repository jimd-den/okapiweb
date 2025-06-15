// src/domain/entities/user-progress.entity.ts

/**
 * @file Defines the UserProgress entity, tracking a user's gamification status.
 */

/**
 * @interface UserProgress
 * @description Represents the user's overall progress within the application, often tied to
 * gamification elements like points and levels. This entity tracks achievements and
 * potentially unlocked features or customizations based on user engagement.
 * Its purpose is to provide a persistent record of the user's advancement and rewards.
 */
export interface UserProgress {
  /** @property {string} userId - The identifier for the user this progress belongs to. In a single-user application using IndexedDB, this might be a default value like 'localUser'. */
  userId: string;
  /** @property {number} points - The total number of points the user has accumulated through various activities and action completions. */
  points: number;
  /** @property {number} level - The current level the user has achieved based on their accumulated points or other criteria. */
  level: number;
  /** @property {string[]} unlockedCustomizations - An array of strings representing identifiers for customization options or features the user has unlocked (e.g., 'colorScheme_ocean', 'avatar_badge_pro'). */
  unlockedCustomizations: string[];
}
