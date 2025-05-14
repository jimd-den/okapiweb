// src/domain/entities/action-log.entity.ts

/**
 * Represents a log entry for a performed action.
 */
export interface ActionLog {
  id: string; // Unique ID for this log entry
  spaceId: string; // ID of the space where the action occurred
  actionDefinitionId: string; // ID of the ActionDefinition that was performed
  timestamp: string; // ISO date string of when the action was logged
  pointsAwarded: number; // Points awarded for this specific log entry
  completedStepId?: string; // Optional: If this log is for a specific step of a multi-step action
  isMultiStepFullCompletion?: boolean; // Optional: True if this log entry signifies the full completion of a multi-step action
  notes?: string; // Optional: Any notes related to this specific log instance
}
