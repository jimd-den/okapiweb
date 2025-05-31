// src/domain/entities/data-entry-log.entity.ts

/**
 * Represents a single submission of data for a 'data-entry' type ActionDefinition
 * or a 'data-entry' step within a 'multi-step' ActionDefinition.
 */
export interface DataEntryLog {
  id: string; // Unique ID for this data entry
  actionDefinitionId: string; // ID of the 'data-entry' ActionDefinition OR the parent 'multi-step' ActionDefinition
  stepId?: string; // Optional: ID of the ActionStep if this data entry is for a step within a multi-step action
  spaceId: string; // ID of the space this data belongs to
  timestamp: string; // ISO date string of when the data was submitted
  data: Record<string, any>; // Stores { fieldName: value } from the submitted form
  pointsAwarded: number; // Points awarded for this data submission (typically from the parent ActionDefinition)
}
