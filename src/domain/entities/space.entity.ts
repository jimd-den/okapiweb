// src/domain/entities/space.entity.ts

/**
 * @file Defines the Space entity, representing a dedicated area for work, tasks, or projects, tied to a specific date.
 */

/**
 * @interface Space
 * @description Represents a user-defined work category, project area, or context, which is specifically
 * designated for a particular date. A Space acts as a container for related actions,
 * to-dos, problems, and metrics. For example, a user might create a "Morning Routine" Space
 * for each day, or a "Project Phoenix" Space for a specific date when they plan to work on it.
 * Its purpose is to help users organize and focus their activities on a day-by-day basis.
 */
export interface Space {
  /** @property {string} id - A unique identifier for this space. */
  id: string;
  /** @property {string} name - A user-friendly name for the space (e.g., "Client Proposal Work", "Daily Chores"). */
  name: string;
  /** @property {string} [description] - An optional, more detailed description of the space's purpose or contents. */
  description?: string;
  /** @property {string} date - An ISO date string (YYYY-MM-DD format) indicating the specific date this space is designated for. This is a key property for organizing spaces chronologically. */
  date: string;
  /** @property {string} creationDate - An ISO date string representing when this space entity was initially created. This might differ from the `date` property if a space for a future date is created in advance. */
  creationDate: string;
  /** @property {string[]} tags - An array of strings representing tags or keywords associated with the space, allowing for categorization and filtering. */
  tags: string[];
  /** @property {string} [colorScheme] - An optional identifier for a predefined or custom color scheme associated with this space, used for UI theming or visual distinction. */
  colorScheme?: string;
  /** @property {string} [goal] - An optional string describing the primary goal or objective for this space on its designated date. */
  goal?: string;
}
