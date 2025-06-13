// src/domain/entities/action-log.entity.ts

/**
 * @file Defines the ActionLog entity, which records an instance of a user performing an action.
 */

/**
 * @interface ActionLog
 * @description Represents a log entry created when a user performs an action defined by an {@link ActionDefinition}.
 * This entity is crucial for tracking user activity, progress, and for generating metrics and timelines.
 * It captures what action was done, when, in what context (Space), and any outcomes or associated data.
 */
export interface ActionLog {
  /** @property {string} id - A unique identifier for this specific log entry. */
  id: string;
  /** @property {string} spaceId - The identifier of the 'Space' in which the action was performed. This links the log to a specific context. */
  spaceId: string;
  /** @property {string} actionDefinitionId - The identifier of the {@link ActionDefinition} that this log entry corresponds to. This specifies what kind of action was performed. */
  actionDefinitionId: string;
  /** @property {string} timestamp - An ISO date string representing the exact date and time when the action was logged. */
  timestamp: string;
  /** @property {number} pointsAwarded - The number of points awarded to the user for this particular instance of performing the action or a step within it. */
  pointsAwarded: number;
  /** @property {string} [completedStepId] - Optional. If the logged action is a step within a 'multi-step' {@link ActionDefinition}, this property holds the ID of the specific {@link ActionStep} that was completed or skipped. */
  completedStepId?: string;
  /** @property {'completed' | 'skipped'} [stepOutcome] - Optional. If `completedStepId` is present, this indicates the outcome of that step (e.g., whether it was 'completed' successfully or 'skipped'). */
  stepOutcome?: 'completed' | 'skipped';
  /** @property {boolean} [isMultiStepFullCompletion] - Optional. Set to `true` if this log entry specifically marks the final completion of all steps in a 'multi-step' action, often resulting in the `pointsForCompletion` from the {@link ActionDefinition} being awarded. */
  isMultiStepFullCompletion?: boolean;
  /** @property {string} [notes] - Optional. Any user-added notes or comments related to this specific instance of the logged action. */
  notes?: string;
  /** @property {number} [durationMs] - Optional. If the performed action was of type 'timer', this property stores the duration of the action in milliseconds. */
  durationMs?: number;
}
