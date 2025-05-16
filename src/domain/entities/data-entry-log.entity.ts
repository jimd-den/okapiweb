// src/domain/entities/data-entry-log.entity.ts

/**
 * Represents a single submission of data for a 'data-entry' type ActionDefinition.
 */
export interface DataEntryLog {
  id: string; // Unique ID for this data entry
  actionDefinitionId: string; // ID of the 'data-entry' ActionDefinition
  spaceId: string; // ID of the space this data belongs to
  timestamp: string; // ISO date string of when the data was submitted
  data: Record<string, any>; // Stores { fieldName: value } from the submitted form
  pointsAwarded: number; // Points awarded for this data submission
}
