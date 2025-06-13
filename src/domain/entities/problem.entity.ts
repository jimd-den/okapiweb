// src/domain/entities/problem.entity.ts

/**
 * @file Defines the Problem entity, used for tracking issues, wastes, or blockers encountered by users.
 */

/**
 * @interface Problem
 * @description Represents a logged problem, waste, impediment, or blocker that a user encounters,
 * typically within a specific 'Space'. This entity helps in identifying, tracking,
 * and resolving issues that hinder progress or efficiency. For example, a user might log
 * a "Blocker" if they cannot proceed with a task, or "Waste" if they identify an inefficient process.
 * Its purpose is to make obstacles visible and manage their resolution.
 */
export interface Problem {
  /** @property {string} id - A unique identifier for this problem log. */
  id: string;
  /** @property {string} spaceId - The identifier of the 'Space' where this problem was identified or is relevant. */
  spaceId: string;
  /** @property {'Waste' | 'Blocker' | 'Issue'} type - The classification of the problem, indicating its nature (e.g., 'Waste', 'Blocker', 'Issue'). */
  type: 'Waste' | 'Blocker' | 'Issue';
  /** @property {string} description - A detailed textual description of the problem, outlining what it is and its impact. */
  description: string;
  /** @property {string} timestamp - An ISO date string representing when the problem was initially logged. */
  timestamp: string;
  /** @property {string} lastModifiedDate - An ISO date string indicating when this problem log was last modified (e.g., updated description, changed status). */
  lastModifiedDate: string;
  /** @property {boolean} resolved - A flag indicating whether the problem has been resolved. `true` if resolved, `false` otherwise. */
  resolved: boolean;
  /** @property {string} [resolutionNotes] - Optional. Notes or comments detailing how the problem was resolved or the outcome of the resolution. This is typically filled when `resolved` is set to `true`. */
  resolutionNotes?: string;
  /** @property {string} [imageDataUri] - Optional. A string containing a data URI (e.g., base64 encoded) for an image associated with the problem, allowing users to visually document the issue. */
  imageDataUri?: string;
}

