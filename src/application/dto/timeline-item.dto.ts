// src/application/dto/timeline-item.dto.ts

export type TimelineItemType = 'action_log' | 'problem' | 'todo' | 'data_entry';

export interface TimelineItem {
  id: string;
  spaceId: string;
  timestamp: string;
  type: TimelineItemType;
  
  title: string;
  description?: string;
  
  // --- ActionLog specific details ---
  actionDefinitionId?: string;
  actionName?: string;
  actionStepDescription?: string;
  stepOutcome?: 'completed' | 'skipped';
  pointsAwarded?: number;
  isMultiStepFullCompletion?: boolean;
  actionLogNotes?: string; 
  completedStepId?: string;
  actionDurationMs?: number; // New: for timer actions

  // --- Problem specific details ---
  problemType?: 'Waste' | 'Blocker' | 'Issue';
  problemResolved?: boolean;
  problemResolutionNotes?: string;
  problemLastModifiedDate?: string;
  problemImageDataUri?: string; 

  // --- Todo specific details ---
  todoStatus?: 'todo' | 'doing' | 'done'; // Replaces todoCompleted
  todoCompleted?: boolean; // Keep for backward compatibility or simple display
  todoCompletionDate?: string;
  todoLastModifiedDate?: string;
  todoBeforeImageDataUri?: string;
  todoAfterImageDataUri?: string;

  // --- DataEntryLog specific details ---
  dataEntryActionName?: string; // Name of the data entry action definition
  dataEntrySubmittedData?: Record<string, any>; // The actual data submitted
  // pointsAwarded is already a common field
}
