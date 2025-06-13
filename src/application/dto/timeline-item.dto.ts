// src/application/dto/timeline-item.dto.ts
/**
 * @file Defines the Data Transfer Object (DTO) for representing items on a user's timeline.
 * This DTO consolidates various domain entities into a unified structure suitable for display.
 */

/**
 * @typedef TimelineItemType
 * @description A type alias representing the different kinds of domain events or entities
 * that can appear as an item on a user's timeline.
 * - 'action_log': Represents an instance of a performed action (from {@link ActionLog}).
 * - 'problem': Represents a logged problem, waste, or blocker (from {@link Problem}).
 * - 'todo': Represents a to-do item, particularly its creation or completion (from {@link Todo}).
 * - 'data_entry': Represents a submission of data (from {@link DataEntryLog}).
 */
export type TimelineItemType = 'action_log' | 'problem' | 'todo' | 'data_entry';

/**
 * @interface TimelineItem
 * @description A Data Transfer Object that represents a single item to be displayed on a user's activity timeline.
 * It aggregates information from various domain entities like {@link ActionLog}, {@link Problem},
 * {@link Todo}, and {@link DataEntryLog} into a common format. This DTO is primarily used by
 * use cases that prepare data for timeline visualizations in the UI.
 * Its purpose is to provide a consistent structure for different types of user activities
 * that occurred at a certain point in time.
 */
export interface TimelineItem {
  // --- Common properties for all timeline items ---
  /** @property {string} id - The unique identifier of the original domain entity (e.g., ActionLog ID, Problem ID). */
  id: string;
  /** @property {string} spaceId - The identifier of the 'Space' where this event occurred or to which it pertains. */
  spaceId: string;
  /** @property {string} timestamp - An ISO date string representing when the event occurred or was logged. This is the primary sorting key for the timeline. */
  timestamp: string;
  /** @property {TimelineItemType} type - The type of the timeline item, indicating which domain entity it represents. */
  type: TimelineItemType;
  /** @property {string} title - A concise title for the timeline item, suitable for display (e.g., action name, problem type). */
  title: string;
  /** @property {string} [description] - An optional, more detailed description of the item (e.g., problem description, to-do description). */
  description?: string;
  /** @property {number} [pointsAwarded] - Optional. Points awarded, relevant for 'action_log' and potentially 'data_entry' types. */
  pointsAwarded?: number;

  // --- ActionLog specific details ---
  /** @property {string} [actionDefinitionId] - Identifier of the {@link ActionDefinition} if type is 'action_log'. */
  actionDefinitionId?: string;
  /** @property {string} [actionName] - Name of the action, if type is 'action_log'. (Convenience property, can be derived from ActionDefinition). */
  actionName?: string;
  /** @property {string} [actionStepDescription] - Description of the completed step, if type is 'action_log' and it's a multi-step action. */
  actionStepDescription?: string;
  /** @property {'completed' | 'skipped'} [stepOutcome] - Outcome of the step, if type is 'action_log' and it's a multi-step action. */
  stepOutcome?: 'completed' | 'skipped';
  /** @property {boolean} [isMultiStepFullCompletion] - True if this 'action_log' marks the full completion of a multi-step action. */
  isMultiStepFullCompletion?: boolean;
  /** @property {string} [actionLogNotes] - Notes associated with the specific {@link ActionLog}. */
  actionLogNotes?: string;
  /** @property {string} [completedStepId] - Identifier of the completed step, if type is 'action_log'. */
  completedStepId?: string;
  /** @property {number} [actionDurationMs] - Duration in milliseconds, if the 'action_log' is for a timer action. */
  actionDurationMs?: number;

  // --- Problem specific details ---
  /** @property {'Waste' | 'Blocker' | 'Issue'} [problemType] - Type of the problem, if type is 'problem'. */
  problemType?: 'Waste' | 'Blocker' | 'Issue';
  /** @property {boolean} [problemResolved] - Resolution status of the problem, if type is 'problem'. */
  problemResolved?: boolean;
  /** @property {string} [problemResolutionNotes] - Notes on how the problem was resolved, if type is 'problem'. */
  problemResolutionNotes?: string;
  /** @property {string} [problemLastModifiedDate] - Last modification date of the problem, if type is 'problem'. */
  problemLastModifiedDate?: string;
  /** @property {string} [problemImageDataUri] - Image data URI associated with the problem, if type is 'problem'. */
  problemImageDataUri?: string;

  // --- Todo specific details ---
  /** @property {'todo' | 'doing' | 'done'} [todoStatus] - Current status of the to-do, if type is 'todo'. */
  todoStatus?: 'todo' | 'doing' | 'done';
  /** @property {boolean} [todoCompleted] - Completion status of the to-do, if type is 'todo'. Kept for simple display or compatibility. Should align with `todoStatus === 'done'`. */
  todoCompleted?: boolean;
  /** @property {string} [todoCompletionDate] - Date when the to-do was completed, if type is 'todo'. */
  todoCompletionDate?: string;
  /** @property {string} [todoLastModifiedDate] - Last modification date of the to-do, if type is 'todo'. */
  todoLastModifiedDate?: string;
  /** @property {string} [todoBeforeImageDataUri] - Image data URI for the 'before' state of the to-do, if type is 'todo'. */
  todoBeforeImageDataUri?: string;
  /** @property {string} [todoAfterImageDataUri] - Image data URI for the 'after' state of the to-do, if type is 'todo'. */
  todoAfterImageDataUri?: string;

  // --- DataEntryLog specific details ---
  /** @property {string} [dataEntryActionName] - Name of the action for which data was entered, if type is 'data_entry'. (Convenience property). */
  dataEntryActionName?: string;
  /** @property {Record<string, any>} [dataEntrySubmittedData] - The actual data submitted, if type is 'data_entry'. */
  dataEntrySubmittedData?: Record<string, any>;
  // `pointsAwarded` is already a common field, so it can be used for data_entry types as well.
}
